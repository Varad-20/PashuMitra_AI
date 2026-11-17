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
import { assessRecord, levelToStatus } from '../utils/assess.js';
import { ruleBasedAssessment } from '../utils/aiFallback.js';
import { computeAnimalBaseline, evaluateEarlyWarning } from '../utils/intelligence.js';

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ---------- Animals ----------
export const listAnimals = wrap(async (req, res) => {
  res.json(await Animal.find().sort({ createdAt: -1 }));
});

export const getAnimal = wrap(async (req, res) => {
  const animal = await Animal.findById(req.params.id);
  if (!animal) return res.status(404).json({ message: 'Animal not found' });
  res.json(animal);
});

export const createAnimal = wrap(async (req, res) => {
  const { isSample, ...body } = req.body;
  res.status(201).json(await Animal.create(body));
});

export const updateAnimal = wrap(async (req, res) => {
  const { isSample, ...body } = req.body;
  const animal = await Animal.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
  if (!animal) return res.status(404).json({ message: 'Animal not found' });
  res.json(animal);
});

export const deleteAnimal = wrap(async (req, res) => {
  const animal = await Animal.findByIdAndDelete(req.params.id);
  if (!animal) return res.status(404).json({ message: 'Animal not found' });
  await HealthRecord.deleteMany({ animal: animal._id });
  await Vaccination.deleteMany({ animal: animal._id });
  await MilkRecord.deleteMany({ animal: animal._id });
  await Treatment.deleteMany({ animal: animal._id });
  await AiAssessment.deleteMany({ animal: animal._id });
  await EarlyWarningAlert.deleteMany({ animal: animal._id });
  await AiChatMessage.deleteMany({ animal: animal._id });
  res.json({ message: 'Animal deleted' });
});

// ---------- Health records ----------
async function applyAssessment(body) {
  const animal = await Animal.findById(body.animal);
  if (!animal) {
    const err = new Error('Selected animal does not exist');
    err.status = 400;
    throw err;
  }
  const symptoms = (body.symptoms || []).map((s) => String(s).trim()).filter(Boolean);
  const assessment = assessRecord({ ...body, temperature: Number(body.temperature), symptoms }, animal.species);
  return { animal, data: { ...body, symptoms, assessment } };
}

export const listRecords = wrap(async (req, res) => {
  const filter = req.query.animal ? { animal: req.query.animal } : {};
  res.json(await HealthRecord.find(filter).sort({ observationDate: -1 }));
});

export const createRecord = wrap(async (req, res) => {
  const { isSample, ...body } = req.body;
  const { animal, data } = await applyAssessment(body);
  const priorRecords = await HealthRecord.find({ animal: animal._id }).sort({ observationDate: 1 });
  const record = await HealthRecord.create(data);

  // Evaluate against individual historical baseline + thresholds and generate Early Warning Alert (avoiding duplicates)
  const alertPayload = evaluateEarlyWarning({ animal, newRecord: record, priorRecords });
  if (alertPayload && !(await EarlyWarningAlert.exists({ healthRecord: record._id }))) {
    await EarlyWarningAlert.create(alertPayload);
  }

  // Recompute and store animal's individual baseline
  const allRecs = [...priorRecords, record];
  const allMilk = await MilkRecord.find({ animal: animal._id });
  const bl = computeAnimalBaseline(animal, allRecs, allMilk);
  animal.baseline = {
    avgTemp: bl.avgTemp,
    avgWeight: bl.avgWeight,
    avgMilk: bl.avgMilk,
    usualAppetite: bl.usualAppetite,
    recordCount: bl.recordCount,
    updatedAt: new Date(),
  };

  animal.healthStatus = levelToStatus(record.assessment.level);
  if (record.weight) animal.weight = record.weight;
  await animal.save();
  res.status(201).json(record);
});

export const updateRecord = wrap(async (req, res) => {
  const { isSample, ...body } = req.body;
  const { data } = await applyAssessment(body);
  const record = await HealthRecord.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!record) return res.status(404).json({ message: 'Record not found' });
  res.json(record);
});

export const deleteRecord = wrap(async (req, res) => {
  const record = await HealthRecord.findByIdAndDelete(req.params.id);
  if (!record) return res.status(404).json({ message: 'Record not found' });
  res.json({ message: 'Record deleted' });
});

// ---------- Vaccinations ----------
export const listVaccinations = wrap(async (req, res) => {
  res.json(await Vaccination.find().sort({ nextDueDate: 1 }));
});

export const createVaccination = wrap(async (req, res) => {
  const { isSample, ...body } = req.body;
  if (!(await Animal.exists({ _id: body.animal }))) return res.status(400).json({ message: 'Selected animal does not exist' });
  res.status(201).json(await Vaccination.create(body));
});

export const updateVaccination = wrap(async (req, res) => {
  const { isSample, ...body } = req.body;
  const vac = await Vaccination.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
  if (!vac) return res.status(404).json({ message: 'Vaccination not found' });
  res.json(vac);
});

export const deleteVaccination = wrap(async (req, res) => {
  const vac = await Vaccination.findByIdAndDelete(req.params.id);
  if (!vac) return res.status(404).json({ message: 'Vaccination not found' });
  res.json({ message: 'Vaccination deleted' });
});

// ---------- Dashboard ----------
export const dashboardStats = wrap(async (req, res) => {
  const animals = await Animal.find();
  const vaccinations = await Vaccination.find();
  const bySpecies = {};
  animals.forEach((a) => (bySpecies[a.species] = (bySpecies[a.species] || 0) + 1));
  const byHealth = { Healthy: 0, 'Needs Attention': 0, Critical: 0 };
  animals.forEach((a) => (byHealth[a.healthStatus] += 1));
  const t = new Date();
  const todayStr = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  const todayMilk = (await MilkRecord.find({ date: todayStr })).reduce((s, m) => s + m.morning + m.evening, 0);
  res.json({
    totalAnimals: animals.length,
    todayMilk,
    healthy: byHealth.Healthy,
    needAttention: byHealth['Needs Attention'] + byHealth.Critical,
    totalFarms: new Set(animals.map((a) => a.farmName)).size,
    vaccinationsDueSoon: vaccinations.filter((v) => v.status === 'Due Soon').length,
    vaccinationsOverdue: vaccinations.filter((v) => v.status === 'Overdue').length,
    bySpecies,
    byHealth,
  });
});

// ---------- AI Health Assistant ----------
const FALLBACK_NOTES = {
  en: 'Informational only. Please confirm any health concern with a qualified veterinarian.',
  hi: 'केवल जानकारी के लिए। कृपया किसी भी स्वास्थ्य समस्या की पुष्टि योग्य पशु चिकित्सक से करें।',
  mr: 'केवळ माहितीसाठी. कृपया कोणत्याही आरोग्य समस्येची खात्री पात्र पशुवैद्यकाकडून करा.',
};

const LANG_NAME = { en: 'English', hi: 'Hindi (हिंदी)', mr: 'Marathi (मराठी)' };

async function askGemini(input) {
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const lang = LANG_NAME[input.language] || 'English';
  const prompt = `You are a livestock health information assistant for farmers. You do NOT diagnose.
Animal: ${input.species} ${input.animalName ? '(' + input.animalName + ')' : ''}
Symptoms: ${(input.symptoms || []).join(', ') || 'none listed'}
Temperature (C): ${input.temperature || 'not provided'}
Appetite: ${input.appetite}
Description: ${input.description || 'none'}
Output language for possibleConcern, reasons, and nextSteps: ${lang} (keep riskLevel in English: "Low", "Medium", or "High").

Reply ONLY with JSON in this shape:
{"possibleConcern": string, "riskLevel": "Low"|"Medium"|"High", "reasons": string[], "nextSteps": string[], "vetRecommended": boolean, "urgent": boolean}
Use cautious wording like "possible" or "may indicate". For severe symptoms set riskLevel High and urgent true.`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json' } }),
      signal: controller.signal,
    });
    if (!r.ok) throw new Error(`Gemini responded with ${r.status}`);
    const json = await r.json();
    const parsed = JSON.parse(json.candidates[0].content.parts[0].text);
    if (!['Low', 'Medium', 'High'].includes(parsed.riskLevel) || !Array.isArray(parsed.nextSteps)) throw new Error('Unexpected AI format');
    return { ...parsed, reasons: parsed.reasons || [], source: 'Gemini AI' };
  } finally {
    clearTimeout(timer);
  }
}

export const aiAssess = wrap(async (req, res) => {
  const { animal, species, symptoms = [], temperature, appetite = 'Normal', description = '', animalName, language = 'en' } = req.body;
  if (!species) return res.status(400).json({ message: 'Please select an animal' });
  if (!symptoms.length && !description.trim() && !temperature) {
    return res.status(400).json({ message: 'Enter symptoms, a description or a temperature' });
  }
  const input = { species, symptoms, temperature, appetite, description, animalName, language };
  const key = process.env.GEMINI_API_KEY;
  let result;
  if (key && key !== 'your_gemini_api_key_here') {
    try {
      result = await askGemini(input);
    } catch (err) {
      console.warn('Gemini failed, using fallback:', err.message);
    }
  }
  if (!result) result = ruleBasedAssessment(input);
  const fullResult = { ...result, disclaimer: FALLBACK_NOTES[language] || FALLBACK_NOTES.en };

  // Save to AiAssessment history if animal ID is valid and DB connected
  if (animal) {
    try {
      await AiAssessment.create({
        animal,
        symptoms,
        temperature: temperature ? Number(temperature) : undefined,
        appetite,
        description,
        language,
        result: fullResult,
      });
    } catch { /* ignore if DB offline */ }
  }
  res.json(fullResult);
});
