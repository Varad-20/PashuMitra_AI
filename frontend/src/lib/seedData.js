// Sample / demonstration data. Used by the seed script AND by the frontend demo mode.
// Dates are relative to "today" so upcoming vaccinations, baselines, and alerts are always fresh.

const day = 24 * 60 * 60 * 1000;
const offset = (days) => new Date(Date.now() + days * day).toISOString();
const ymd = (days) => {
  const d = new Date(Date.now() + days * day);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const sampleAnimals = [
  { animalId: 'COW-001', name: 'Lakshmi', species: 'Cow', breed: 'Gir', age: 5, gender: 'Female', weight: 420, farmName: 'Green Valley Dairy', healthStatus: 'Healthy', added: -120 },
  { animalId: 'COW-002', name: 'Gauri', species: 'Cow', breed: 'Holstein Friesian', age: 4, gender: 'Female', weight: 510, farmName: 'Green Valley Dairy', healthStatus: 'Needs Attention', added: -100 },
  { animalId: 'BUF-001', name: 'Kali', species: 'Buffalo', breed: 'Murrah', age: 6, gender: 'Female', weight: 560, farmName: 'Sunrise Farm', healthStatus: 'Healthy', added: -90 },
  { animalId: 'BUF-002', name: 'Bhima', species: 'Buffalo', breed: 'Jaffarabadi', age: 3, gender: 'Male', weight: 480, farmName: 'Sunrise Farm', healthStatus: 'Healthy', added: -80 },
  { animalId: 'GOT-001', name: 'Moti', species: 'Goat', breed: 'Jamnapari', age: 2, gender: 'Male', weight: 45, farmName: 'Hillside Goat Farm', healthStatus: 'Healthy', added: -70 },
  { animalId: 'GOT-002', name: 'Chandni', species: 'Goat', breed: 'Sirohi', age: 3, gender: 'Female', weight: 38, farmName: 'Hillside Goat Farm', healthStatus: 'Critical', added: -60 },
  { animalId: 'SHP-001', name: 'Bhuri', species: 'Sheep', breed: 'Deccani', age: 2, gender: 'Female', weight: 32, farmName: 'Hillside Goat Farm', healthStatus: 'Healthy', added: -45 },
  { animalId: 'SHP-002', name: 'Raja', species: 'Sheep', breed: 'Marwari', age: 4, gender: 'Male', weight: 40, farmName: 'Patil Livestock', healthStatus: 'Healthy', added: -30 },
  { animalId: 'COW-003', name: 'Nandini', species: 'Cow', breed: 'Sahiwal', age: 7, gender: 'Female', weight: 450, farmName: 'Patil Livestock', healthStatus: 'Needs Attention', added: -20 },
  { animalId: 'COW-004', name: 'Shyam', species: 'Cow', breed: 'Jersey', age: 3, gender: 'Male', weight: 380, farmName: 'Patil Livestock', healthStatus: 'Healthy', added: -10 },
].map(({ added, ...a }) => ({ ...a, dateAdded: offset(added), isSample: true }));

// Historical health records (animal = index in sampleAnimals)
// At least 6 animals have 3–5 historical records for Digital Twin baselines; 4 animals have <3 records to demonstrate "Building baseline".
export const sampleRecords = [
  // 0: Lakshmi (Cow, Healthy) - 4 records
  { animal: 0, temperature: 38.6, weight: 420, appetite: 'Normal', activity: 'Normal', symptoms: [], notes: 'Healthy and active', day: -2 },
  { animal: 0, temperature: 38.5, weight: 419, appetite: 'Normal', activity: 'Normal', symptoms: [], notes: 'Routine check', day: -10 },
  { animal: 0, temperature: 38.5, weight: 418, appetite: 'Normal', activity: 'Normal', symptoms: [], notes: 'Good cud chewing', day: -19 },
  { animal: 0, temperature: 38.4, weight: 416, appetite: 'Normal', activity: 'Normal', symptoms: [], notes: 'Monthly check', day: -30 },

  // 1: Gauri (Cow, Needs Attention) - 4 records (baseline ~38.5°C, latest rose to 39.8°C + Low appetite)
  { animal: 1, temperature: 39.8, weight: 506, appetite: 'Low', activity: 'Normal', symptoms: ['Reduced milk'], notes: 'Left half of morning concentrate feed uneaten', day: -1 },
  { animal: 1, temperature: 38.5, weight: 512, appetite: 'Normal', activity: 'Normal', symptoms: [], notes: 'Normal check', day: -8 },
  { animal: 1, temperature: 38.6, weight: 514, appetite: 'Normal', activity: 'Normal', symptoms: [], notes: 'Routine check', day: -16 },
  { animal: 1, temperature: 38.4, weight: 512, appetite: 'Normal', activity: 'Normal', symptoms: [], notes: 'Baseline check', day: -25 },

  // 2: Kali (Buffalo, Healthy) - 4 records
  { animal: 2, temperature: 38.6, weight: 560, appetite: 'Normal', activity: 'Normal', symptoms: [], notes: 'Good milk yield', day: -3 },
  { animal: 2, temperature: 38.5, weight: 558, appetite: 'Normal', activity: 'Normal', symptoms: [], notes: 'Active grazing', day: -11 },
  { animal: 2, temperature: 38.6, weight: 556, appetite: 'Normal', activity: 'Normal', symptoms: [], notes: 'Routine check', day: -20 },
  { animal: 2, temperature: 38.5, weight: 555, appetite: 'Normal', activity: 'Normal', symptoms: [], notes: 'Baseline check', day: -29 },

  // 4: Moti (Goat, Healthy) - 3 records
  { animal: 4, temperature: 39.3, weight: 45, appetite: 'Normal', activity: 'Normal', symptoms: [], notes: 'Active', day: -4 },
  { animal: 4, temperature: 39.2, weight: 44.5, appetite: 'Normal', activity: 'Normal', symptoms: [], notes: 'Routine check', day: -14 },
  { animal: 4, temperature: 39.3, weight: 44, appetite: 'Normal', activity: 'Normal', symptoms: [], notes: 'Baseline check', day: -24 },

  // 5: Chandni (Goat, Critical) - 4 records (baseline ~39.3°C, latest spiked to 41.2°C + No appetite)
  { animal: 5, temperature: 41.2, weight: 37, appetite: 'No appetite', activity: 'Low', symptoms: ['Cough', 'Nasal discharge', 'Fever'], notes: 'Isolated from herd in shaded pen', day: -1 },
  { animal: 5, temperature: 39.4, weight: 39, appetite: 'Normal', activity: 'Normal', symptoms: [], notes: 'Normal check', day: -9 },
  { animal: 5, temperature: 39.3, weight: 39, appetite: 'Normal', activity: 'Normal', symptoms: [], notes: 'Routine check', day: -18 },
  { animal: 5, temperature: 39.2, weight: 38.5, appetite: 'Normal', activity: 'Normal', symptoms: [], notes: 'Baseline check', day: -27 },

  // 8: Nandini (Cow, Needs Attention) - 4 records (baseline ~38.5°C, latest 39.2°C + Low appetite/activity)
  { animal: 8, temperature: 39.2, weight: 444, appetite: 'Low', activity: 'Low', symptoms: ['Weakness'], notes: 'Less active during grazing', day: -2 },
  { animal: 8, temperature: 38.5, weight: 450, appetite: 'Normal', activity: 'Normal', symptoms: [], notes: 'Routine check', day: -10 },
  { animal: 8, temperature: 38.6, weight: 451, appetite: 'Normal', activity: 'Normal', symptoms: [], notes: 'Routine check', day: -19 },
  { animal: 8, temperature: 38.5, weight: 450, appetite: 'Normal', activity: 'Normal', symptoms: [], notes: 'Baseline check', day: -28 },

  // Animals with <3 records (demonstrates "Building baseline" state)
  { animal: 3, temperature: 38.7, weight: 480, appetite: 'Normal', activity: 'Normal', symptoms: [], notes: 'Initial check', day: -6 },
  { animal: 6, temperature: 39.5, weight: 32, appetite: 'Normal', activity: 'Normal', symptoms: [], notes: 'Initial check', day: -13 },
  { animal: 7, temperature: 39.4, weight: 40, appetite: 'Normal', activity: 'Normal', symptoms: [], notes: 'Initial check', day: -16 },
  { animal: 9, temperature: 38.6, weight: 380, appetite: 'Normal', activity: 'Normal', symptoms: [], notes: 'Initial check', day: -8 },
].map(({ day: d, ...r }) => ({ ...r, observationDate: offset(d), isSample: true }));

export const sampleVaccinations = [
  { animal: 0, vaccineName: 'FMD Vaccine', given: -170, due: 10, status: 'Due Soon' },
  { animal: 1, vaccineName: 'Haemorrhagic Septicaemia (HS)', given: -200, due: -5, status: 'Overdue' },
  { animal: 2, vaccineName: 'Brucellosis Vaccine', given: -60, due: 120, status: 'Completed' },
  { animal: 3, vaccineName: 'Anthrax Vaccine', given: -90, due: 275, status: 'Completed' },
  { animal: 4, vaccineName: 'PPR Vaccine', given: -340, due: 7, status: 'Due Soon' },
  { animal: 5, vaccineName: 'Enterotoxaemia Vaccine', given: -180, due: -12, status: 'Overdue' },
  { animal: 6, vaccineName: 'Sheep Pox Vaccine', given: -30, due: 335, status: 'Completed' },
  { animal: 8, vaccineName: 'Black Quarter (BQ) Vaccine', given: -175, due: 5, status: 'Due Soon' },
  { animal: 7, vaccineName: 'FMD Vaccine', given: -15, due: 165, status: 'Completed' },
].map(({ given, due, ...v }) => ({ ...v, vaccinationDate: offset(given), nextDueDate: offset(due), isSample: true }));

// Milk records across the last 21 days for Lakshmi (0), Gauri (1), Kali (2), Nandini (8)
const milkSeeds = [
  { animal: 0, d: 0, morning: 7.5, evening: 6.5, pricePerLitre: 58, feedExpense: 260 },
  { animal: 1, d: 0, morning: 6.8, evening: 6.0, pricePerLitre: 54, feedExpense: 320 },
  { animal: 2, d: 0, morning: 8.5, evening: 7.5, pricePerLitre: 68, feedExpense: 340 },
  { animal: 8, d: 0, morning: 5.5, evening: 5.0, pricePerLitre: 56, feedExpense: 240 },
  { animal: 0, d: -1, morning: 7.2, evening: 6.4, pricePerLitre: 58, feedExpense: 255 },
  { animal: 1, d: -1, morning: 9.2, evening: 8.2, pricePerLitre: 54, feedExpense: 320 },
  { animal: 2, d: -1, morning: 8.2, evening: 7.4, pricePerLitre: 68, feedExpense: 340 },
  { animal: 8, d: -1, morning: 6.2, evening: 5.4, pricePerLitre: 56, feedExpense: 240 },
  { animal: 0, d: -2, morning: 7.0, evening: 6.2, pricePerLitre: 58, feedExpense: 250 },
  { animal: 1, d: -2, morning: 9.1, evening: 8.0, pricePerLitre: 54, feedExpense: 315 },
  { animal: 2, d: -2, morning: 8.4, evening: 7.6, pricePerLitre: 68, feedExpense: 340 },
  { animal: 0, d: -3, morning: 7.4, evening: 6.6, pricePerLitre: 58, feedExpense: 260 },
  { animal: 2, d: -3, morning: 8.0, evening: 7.2, pricePerLitre: 68, feedExpense: 335 },
  { animal: 8, d: -3, morning: 6.4, evening: 5.6, pricePerLitre: 56, feedExpense: 245 },
  { animal: 0, d: -4, morning: 7.1, evening: 6.3, pricePerLitre: 58, feedExpense: 255 },
  { animal: 1, d: -4, morning: 9.4, evening: 8.4, pricePerLitre: 54, feedExpense: 320 },
  { animal: 2, d: -5, morning: 8.6, evening: 7.4, pricePerLitre: 68, feedExpense: 340 },
  { animal: 0, d: -6, morning: 7.3, evening: 6.5, pricePerLitre: 58, feedExpense: 260 },
  { animal: 1, d: -6, morning: 9.0, evening: 8.1, pricePerLitre: 54, feedExpense: 320 },
  { animal: 2, d: -10, morning: 8.5, evening: 7.5, pricePerLitre: 68, feedExpense: 340 },
  { animal: 0, d: -14, morning: 7.0, evening: 6.4, pricePerLitre: 58, feedExpense: 250 },
  { animal: 1, d: -18, morning: 9.5, evening: 8.3, pricePerLitre: 54, feedExpense: 325 },
];

export const sampleMilkRecords = milkSeeds.map(({ d, ...m }) => ({ ...m, date: ymd(d), isSample: true }));

export const sampleTreatments = [
  { animal: 1, treatment: 'Vitamin B-Complex & Mineral Tonics', details: 'Given for low appetite and mild fatigue (10 ml IM for 3 days)', vetName: 'Dr. R. Deshmukh', day: -1 },
  { animal: 5, treatment: 'Antibiotic & Antipyretic Therapy', details: 'Oxytetracycline + Meloxicam injection after high fever and respiratory signs; isolated in sick pen', vetName: 'Dr. S. Kulkarni', day: -1 },
  { animal: 0, treatment: 'Routine Deworming (Albendazole)', details: 'Oral drench given during quarterly herd health camp', vetName: 'Dr. R. Deshmukh', day: -30 },
  { animal: 2, treatment: 'Calcium & Mineral Supplement', details: 'Oral calcium gel course to support peak lactation', vetName: 'Dr. A. Patil', day: -14 },
  { animal: 8, treatment: 'Hoof Trimming & Antiseptic Footbath', details: 'Preventive hoof care and copper sulphate footbath', vetName: 'Dr. A. Patil', day: -4 },
].map(({ day: d, ...t }) => ({ ...t, date: offset(d), isSample: true }));

export const sampleAiAssessments = [
  {
    animal: 5,
    symptoms: ['Cough', 'Nasal discharge', 'Fever'],
    temperature: 41.2,
    appetite: 'No appetite',
    description: 'Breathing fast and standing away from the rest of the goats',
    language: 'en',
    result: {
      possibleConcern: 'Possible respiratory discomfort; Possible fever or systemic infection',
      riskLevel: 'High',
      reasons: [
        'Temperature 41.2°C is above the usual range for a goat',
        'The animal is not eating at all',
        '3 symptoms reported together',
      ],
      nextSteps: [
        'Contact a veterinarian promptly',
        'Separate the animal from the herd if possible',
        'Keep the animal in a clean, shaded, comfortable area with fresh water',
        'Do not give human medicines without veterinary advice',
      ],
      vetRecommended: true,
      urgent: true,
      source: 'Rule-based',
      disclaimer: 'Informational only. Please confirm any health concern with a qualified veterinarian.',
    },
    day: -1,
  },
  {
    animal: 1,
    symptoms: ['Reduced milk'],
    temperature: 39.8,
    appetite: 'Low',
    description: 'Left half of morning concentrate feed uneaten',
    language: 'en',
    result: {
      possibleConcern: 'Possible udder health issue',
      riskLevel: 'Medium',
      reasons: [
        'Temperature 39.8°C is above the usual range for a cow',
        'Appetite is reduced',
        'Symptoms reported: Reduced milk',
      ],
      nextSteps: [
        'Monitor temperature, appetite and behaviour every few hours',
        'Call a veterinarian if there is no improvement within 24 hours',
        'Keep the animal in a clean, shaded, comfortable area with fresh water',
        'Do not give human medicines without veterinary advice',
      ],
      vetRecommended: true,
      urgent: false,
      source: 'Rule-based',
      disclaimer: 'Informational only. Please confirm any health concern with a qualified veterinarian.',
    },
    day: -1,
  },
  {
    animal: 0,
    symptoms: [],
    temperature: 38.6,
    appetite: 'Normal',
    description: 'Routine pre-vaccination check',
    language: 'en',
    result: {
      possibleConcern: 'No clear concern from the details given',
      riskLevel: 'Low',
      reasons: ['No concerning signs were reported in the details provided'],
      nextSteps: [
        'Continue routine observation and record any changes',
        'Keep the animal in a clean, shaded, comfortable area with fresh water',
        'Do not give human medicines without veterinary advice',
      ],
      vetRecommended: false,
      urgent: false,
      source: 'Rule-based',
      disclaimer: 'Informational only. Please confirm any health concern with a qualified veterinarian.',
    },
    day: -12,
  },
].map(({ day: d, ...a }) => ({ ...a, date: offset(d), isSample: true }));

// Seeded Early Warning Alerts (comparing current observation against the animal's historical baseline)
export const sampleEarlyWarnings = [
  {
    animal: 5, // Chandni (Goat)
    riskLevel: 'High',
    detectedChange: 'High fever (41.2°C vs 39.3°C baseline) · Complete loss of appetite · Symptoms: Cough, Nasal discharge, Fever',
    reason: "Temperature (41.2°C) is critically above Chandni's recorded baseline (39.3°C) and species limit (40.3°C). Animal has stopped eating (No appetite recorded). Observed symptoms: Cough, Nasal discharge, Fever.",
    previousValue: { temperature: '39.4°C', appetite: 'Normal', weight: '39 kg' },
    currentValue: { temperature: '41.2°C', appetite: 'No appetite', weight: '37 kg' },
    recommendedAction: 'Isolate the animal in a comfortable shaded area, check water intake, and contact a veterinarian promptly for clinical assessment.',
    status: 'Active',
    followUps: [
      {
        note: 'Moved to shaded isolation pen; Dr. Kulkarni notified and started antibiotic therapy.',
        temperature: 40.8,
        appetite: 'Low',
        date: offset(-0.5),
      },
    ],
    day: -1,
  },
  {
    animal: 1, // Gauri (Cow)
    riskLevel: 'Medium',
    detectedChange: 'Elevated temperature (39.8°C vs 38.5°C baseline) · Appetite reduced · Milk yield dropped',
    reason: "Temperature is above the animal's recorded baseline (38.5°C -> 39.8°C, +1.3°C) and appetite has reduced. This change requires attention. Monitor the animal and contact a veterinarian for assessment.",
    previousValue: { temperature: '38.5°C', appetite: 'Normal', weight: '512 kg' },
    currentValue: { temperature: '39.8°C', appetite: 'Low', weight: '506 kg' },
    recommendedAction: 'Monitor body temperature and appetite closely every 4–6 hours. Contact a veterinarian if observations do not normalize within 24 hours.',
    status: 'Active',
    followUps: [],
    day: -1,
  },
  {
    animal: 8, // Nandini (Cow)
    riskLevel: 'Medium',
    detectedChange: 'Temperature +0.7°C above personal baseline (39.2°C) · Appetite reduced · Low activity',
    reason: "Temperature (39.2°C) is 0.7°C higher than Nandini's individual baseline (38.5°C). Appetite dropped from Normal to Low and activity level is reduced.",
    previousValue: { temperature: '38.5°C', appetite: 'Normal', weight: '450 kg' },
    currentValue: { temperature: '39.2°C', appetite: 'Low', weight: '444 kg' },
    recommendedAction: 'Monitor body temperature and appetite closely every 4–6 hours. Check hooves and grazing comfort.',
    status: 'Active',
    followUps: [],
    day: -2,
  },
  {
    animal: 0, // Lakshmi (Cow) - historical reviewed alert
    riskLevel: 'Low',
    detectedChange: 'Mild afternoon temperature rise (39.1°C) after heat exposure',
    reason: 'Slight afternoon rise above 38.5°C baseline after summer grazing; appetite remained Normal.',
    previousValue: { temperature: '38.5°C', appetite: 'Normal', weight: '418 kg' },
    currentValue: { temperature: '39.1°C', appetite: 'Normal', weight: '418 kg' },
    recommendedAction: 'Provide cool drinking water and shade; recheck temperature in the evening.',
    status: 'Reviewed',
    reviewNote: 'Normalized to 38.5°C by evening after shade and water.',
    reviewedAt: offset(-14),
    followUps: [
      {
        note: 'Evening temperature returned to 38.5°C; chewing cud normally.',
        temperature: 38.5,
        appetite: 'Normal',
        date: offset(-14),
      },
    ],
    day: -15,
  },
].map(({ day: d, ...w }) => ({ ...w, createdAt: offset(d), isSample: true }));

export const sampleChatHistory = [
  {
    animal: 1, // Gauri
    language: 'mr',
    userMessage: 'माझ्या गायीला ताप आला आहे आणि ती चारा खात नाही.',
    assistantReply:
      "**Gauri (COW-002)** साठीच्या नोंदी आणि तुमच्या संदेशाच्या आधारे:\n\nजनावराला ताप असणे आणि चारा न खाणे हे संसर्ग किंवा पचनाच्या त्रासाचे लक्षण असू शकते. आमच्या रेकॉर्डनुसार शेवटचे तापमान **39.8°C** (सरासरी बेसलाईन 38.5°C) आणि भूक **Low** नोंदवली गेली आहे.",
    riskLevel: 'High',
    supportingRecords: [
      'जनावर प्रोफाईल: Gauri (COW-002), वय 4 वर्षे, Holstein Friesian (Cow), सद्यस्थिती: Needs Attention.',
      'अलीकडील आरोग्य नोंद: तापमान 39.8°C (वैयक्तिक सरासरी बेसलाईन: 38.5°C), भूक: Low, हालचाल: Normal, लक्षणे: Reduced milk.',
      'सक्रिय पूर्वसूचना अलर्ट (Medium धोका): Elevated temperature (39.8°C vs 38.5°C baseline) · Appetite reduced.',
    ],
    recommendedSteps: [
      'तात्काळ पशुवैद्यकाशी (किंवा टोल-फ्री १९६२ हेल्पलाईनवर) संपर्क साधा.',
      'जनावराला स्वच्छ, सावलीच्या आणि हवेशीर ठिकाणी ठेवा व पुरेसे स्वच्छ पाणी द्या.',
      'पशुवैद्यकाच्या सल्ल्याशिवाय कोणतीही मानवी औषधे किंवा प्रतिजैविक (Antibiotics) देऊ नका.',
    ],
    vetRecommended: true,
    source: 'Context-Aware Rule Engine',
    createdAt: offset(-1),
    isSample: true,
  },
];
