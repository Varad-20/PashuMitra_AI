import {
  Animal,
  HealthRecord,
  Vaccination,
  MilkRecord,
  Treatment,
  AiAssessment,
  EarlyWarningAlert,
  AiChatMessage,
} from '../models/index.js';
import {
  computeAnimalBaseline,
  computeIllustrativeHealthScore,
  buildContextAwareFallbackReply,
} from '../utils/intelligence.js';

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ---------- Early Warning Alerts ----------
export const listAlerts = wrap(async (req, res) => {
  const filter = {};
  if (req.query.animal) filter.animal = req.query.animal;
  if (req.query.status) filter.status = req.query.status;
  res.json(await EarlyWarningAlert.find(filter).sort({ createdAt: -1 }));
});

export const reviewAlert = wrap(async (req, res) => {
  const alert = await EarlyWarningAlert.findById(req.params.id);
  if (!alert) return res.status(404).json({ message: 'Alert not found' });
  alert.status = req.body.status === 'Active' ? 'Active' : 'Reviewed';
  alert.reviewedAt = alert.status === 'Reviewed' ? new Date() : undefined;
  if (req.body.reviewNote !== undefined) alert.reviewNote = String(req.body.reviewNote).trim();
  await alert.save();
  res.json(alert);
});

export const addAlertFollowUp = wrap(async (req, res) => {
  const alert = await EarlyWarningAlert.findById(req.params.id);
  if (!alert) return res.status(404).json({ message: 'Alert not found' });
  const { note, temperature, appetite } = req.body;
  if (!note || !String(note).trim()) {
    return res.status(400).json({ message: 'Follow-up observation note is required' });
  }
  alert.followUps.push({
    note: String(note).trim(),
    temperature: temperature ? Number(temperature) : undefined,
    appetite: appetite || undefined,
    date: new Date(),
  });
  await alert.save();
  res.json(alert);
});

export const deleteAlert = wrap(async (req, res) => {
  const alert = await EarlyWarningAlert.findByIdAndDelete(req.params.id);
  if (!alert) return res.status(404).json({ message: 'Alert not found' });
  res.json({ message: 'Alert deleted' });
});

// ---------- Animal Digital Twin ----------
export const getAnimalDigitalTwin = wrap(async (req, res) => {
  const animal = await Animal.findById(req.params.id);
  if (!animal) return res.status(404).json({ message: 'Animal not found' });

  const [records, vaccinations, milk, treatments, alerts, aiAssessments] = await Promise.all([
    HealthRecord.find({ animal: animal._id }).sort({ observationDate: -1 }),
    Vaccination.find({ animal: animal._id }).sort({ nextDueDate: 1 }),
    MilkRecord.find({ animal: animal._id }).sort({ date: -1 }),
    Treatment.find({ animal: animal._id }).sort({ date: -1 }),
    EarlyWarningAlert.find({ animal: animal._id }).sort({ createdAt: -1 }),
    AiAssessment.find({ animal: animal._id }).sort({ date: -1 }),
  ]);

  const baseline = computeAnimalBaseline(animal, records, milk);
  const illustrativeScore = computeIllustrativeHealthScore(animal, baseline, vaccinations);

  res.json({
    animal,
    baseline,
    illustrativeScore,
    records,
    vaccinations,
    milk,
    treatments,
    alerts,
    aiAssessments,
  });
});

// ---------- Context-Aware Multilingual AI Voice Chat ----------
const LANG_NAMES = { en: 'English', hi: 'Hindi (हिन्दी)', mr: 'Marathi (मराठी)' };

async function askGeminiContextual({ message, language, animal, baseline, recentRecords, activeAlerts, vaccinations }) {
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const langName = LANG_NAMES[language] || 'English';

  const recSummary = recentRecords
    .slice(0, 4)
    .map(
      (r) =>
        `${new Date(r.observationDate).toISOString().slice(0, 10)}: Temp ${r.temperature}°C, Appetite ${r.appetite}, Activity ${r.activity}${
          r.symptoms?.length ? `, Symptoms [${r.symptoms.join(', ')}]` : ''
        }`
    )
    .join('; ');

  const alertSummary = activeAlerts
    .slice(0, 3)
    .map((a) => `${a.riskLevel} risk (${a.detectedChange})`)
    .join('; ');

  const vaccSummary = vaccinations
    .slice(0, 3)
    .map((v) => `${v.vaccineName} (${v.status})`)
    .join('; ');

  const prompt = `You are PashuMitra AI, an informational livestock health assistant for Indian farmers. You NEVER claim to have physically examined an animal and NEVER provide a definitive veterinary diagnosis. Never invent missing records.
Selected Animal Context (sanitized, no personal farmer data):
- Name & ID: ${animal.name} (${animal.animalId})
- Species & Breed: ${animal.breed} ${animal.species}, Age: ${animal.age} yrs, Weight: ${animal.weight} kg, Current Status: ${animal.healthStatus}
- Individual Baseline: ${baseline.status === 'ready' ? `Avg Temp ${baseline.avgTemp}°C, Usual Appetite ${baseline.usualAppetite}` : 'Building baseline (<3 records)'}
- Recent Health Records: ${recSummary || 'None recorded'}
- Active Early Warnings: ${alertSummary || 'None'}
- Vaccinations: ${vaccSummary || 'None'}

Farmer Question: "${message}"
Required Output Language for reply, supportingRecords,recommendedSteps, and disclaimer: ${langName} (keep riskLevel strictly as "Low", "Medium", or "High").

Respond ONLY with valid JSON in this exact shape:
{
  "reply": string,
  "riskLevel": "Low" | "Medium" | "High",
  "supportingRecords": string[],
  "recommendedSteps": string[],
  "vetRecommended": boolean,
  "disclaimer": string
}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
        signal: controller.signal,
      }
    );
    if (!r.ok) throw new Error(`Gemini HTTP ${r.status}`);
    const json = await r.json();
    const parsed = JSON.parse(json.candidates[0].content.parts[0].text);
    if (!parsed.reply || !['Low', 'Medium', 'High'].includes(parsed.riskLevel)) {
      throw new Error('Unexpected Gemini JSON format');
    }
    return {
      reply: parsed.reply,
      riskLevel: parsed.riskLevel,
      supportingRecords: Array.isArray(parsed.supportingRecords) ? parsed.supportingRecords : [],
      recommendedSteps: Array.isArray(parsed.recommendedSteps) ? parsed.recommendedSteps : [],
      vetRecommended: Boolean(parsed.vetRecommended),
      disclaimer: parsed.disclaimer || '',
      source: 'Gemini AI (Context-Aware)',
    };
  } finally {
    clearTimeout(timer);
  }
}

export const listChatHistory = wrap(async (req, res) => {
  const filter = req.query.animal ? { animal: req.query.animal } : {};
  res.json(await AiChatMessage.find(filter).sort({ createdAt: 1 }).limit(50));
});

export const postContextualChat = wrap(async (req, res) => {
  const { animal: animalId, message, language = 'en', contextSnapshot } = req.body;
  if (!message || !String(message).trim()) {
    return res.status(400).json({ message: 'Please enter or speak a question or symptom description' });
  }

  let animal = null;
  let recentRecords = [];
  let activeAlerts = [];
  let vaccinations = [];
  let milk = [];

  // Fetch real animal records from DB when connected (by _id or by animalId code like 'COW-002'), or fall back to sanitized snapshot
  try {
    if (animalId) {
      if (animalId.match?.(/^[0-9a-fA-F]{24}$/)) {
        animal = await Animal.findById(animalId);
      }
      if (!animal && contextSnapshot?.animal?.animalId) {
        animal = await Animal.findOne({ animalId: contextSnapshot.animal.animalId });
      }
      if (!animal) {
        animal = await Animal.findOne({ animalId: animalId });
      }
      if (animal) {
        [recentRecords, activeAlerts, vaccinations, milk] = await Promise.all([
          HealthRecord.find({ animal: animal._id }).sort({ observationDate: -1 }).limit(6),
          EarlyWarningAlert.find({ animal: animal._id, status: 'Active' }).sort({ createdAt: -1 }),
          Vaccination.find({ animal: animal._id }).sort({ nextDueDate: 1 }),
          MilkRecord.find({ animal: animal._id }).sort({ date: -1 }).limit(6),
        ]);
      }
    }
  } catch { /* DB disconnected - use snapshot if provided */ }

  if (!animal && contextSnapshot?.animal) {
    animal = contextSnapshot.animal;
    recentRecords = contextSnapshot.recentRecords || [];
    activeAlerts = contextSnapshot.activeAlerts || [];
    vaccinations = contextSnapshot.vaccinations || [];
    milk = contextSnapshot.milk || [];
  }

  if (!animal) {
    return res.status(400).json({ message: 'Please select an animal' });
  }

  const baseline = computeAnimalBaseline(animal, recentRecords, milk);
  const key = process.env.GEMINI_API_KEY;
  let responseData;

  if (key && key !== 'your_gemini_api_key_here') {
    try {
      responseData = await askGeminiContextual({
        message,
        language,
        animal,
        baseline,
        recentRecords,
        activeAlerts,
        vaccinations,
      });
    } catch (err) {
      console.warn('Gemini contextual chat failed, using fallback:', err.message);
    }
  }

  if (!responseData) {
    responseData = buildContextAwareFallbackReply({
      message,
      language,
      animal,
      baseline,
      recentRecords,
      activeAlerts,
      vaccinations,
    });
  }

  // Save chat message if DB is connected and animal has a valid ObjectId
  let savedChat = null;
  try {
    savedChat = await AiChatMessage.create({
      animal: animal._id,
      language: ['en', 'hi', 'mr'].includes(language) ? language : 'en',
      userMessage: String(message).trim(),
      assistantReply: responseData.reply,
      riskLevel: responseData.riskLevel,
      supportingRecords: responseData.supportingRecords,
      recommendedSteps: responseData.recommendedSteps,
      vetRecommended: responseData.vetRecommended,
      source: responseData.source,
    });
  } catch { /* ignore if DB offline */ }

  res.json({
    ...responseData,
    chatId: savedChat?._id,
    createdAt: savedChat?.createdAt || new Date().toISOString(),
  });
});
