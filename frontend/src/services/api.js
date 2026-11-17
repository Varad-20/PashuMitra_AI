// Data layer: talks to the Express API when the backend + MongoDB are available,
// otherwise falls back to DEMO MODE (data saved in the browser's localStorage).
import axios from 'axios';
import {
  sampleAnimals,
  sampleRecords,
  sampleVaccinations,
  sampleMilkRecords,
  sampleTreatments,
  sampleAiAssessments,
  sampleEarlyWarnings,
  sampleChatHistory,
} from '../lib/seedData.js';
import { assessRecord, levelToStatus } from '../lib/assess.js';
import { ruleBasedAssessment } from '../lib/aiFallback.js';
import {
  computeAnimalBaseline,
  evaluateEarlyWarning,
  buildContextAwareFallbackReply,
} from '../lib/intelligence.js';

// Resolve API base URL dynamically:
// 1. Use VITE_API_URL if set (unless it points to localhost while opened from an Android phone on LAN)
// 2. Otherwise use '/api' (proxied by Vite dev server) or fallback to 'http://<current-lan-ip>:5000/api'
function resolveApiBaseUrl() {
  const configured = import.meta.env.VITE_API_URL;
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const isRemoteDevice = host && host !== 'localhost' && host !== '127.0.0.1';
  if (configured) {
    if (isRemoteDevice && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(configured)) {
      return configured.replace(/localhost|127\.0\.0\.1/i, host);
    }
    return configured;
  }
  return '/api';
}

const http = axios.create({ baseURL: resolveApiBaseUrl(), timeout: 10000 });
const STORAGE_KEY = 'pashumitra_demo_data_v3';
const PATHS = {
  animals: '/animals',
  records: '/health-records',
  vaccinations: '/vaccinations',
  milk: '/milk',
  treatments: '/treatments',
  aiAssessments: '/ai-assessments',
  alerts: '/alerts',
  chatHistory: '/ai/chat-history',
};

const FALLBACK_NOTES = {
  en: 'Informational only. Please confirm any health concern with a qualified veterinarian.',
  hi: 'केवल जानकारी के लिए। कृपया किसी भी स्वास्थ्य समस्या की पुष्टि योग्य पशु चिकित्सक से करें।',
  mr: 'केवळ माहितीसाठी. कृपया कोणत्याही आरोग्य समस्येची खात्री पात्र पशुवैद्यकाकडून करा.',
};

let mode = 'demo';
export const getMode = () => mode;

// Ask the backend if it is running AND connected to MongoDB.
export async function detectMode() {
  if (import.meta.env.VITE_FORCE_DEMO === 'true') return (mode = 'demo');
  try {
    const { data } = await http.get('/health', { timeout: 3000 });
    mode = data.database === 'connected' ? 'api' : 'demo';
  } catch {
    mode = 'demo';
  }
  return mode;
}

export function errMessage(err) {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') return 'Cannot reach the server. Is the backend running?';
  return err?.message || 'Something went wrong';
}

// ---------------- Demo store (localStorage) ----------------
const uid = () => 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function buildSeed() {
  const animals = sampleAnimals.map((a, i) => ({ ...a, _id: 'animal-' + (i + 1) }));
  const records = sampleRecords.map((r, i) => ({
    ...r,
    _id: 'record-' + (i + 1),
    animal: animals[r.animal]._id,
    assessment: assessRecord(r, animals[r.animal].species),
  }));
  const vaccinations = sampleVaccinations.map((v, i) => ({ ...v, _id: 'vac-' + (i + 1), animal: animals[v.animal]._id }));
  const milk = sampleMilkRecords.map((m, i) => ({ ...m, _id: 'milk-' + (i + 1), animal: animals[m.animal]._id }));
  const treatments = sampleTreatments.map((t, i) => ({ ...t, _id: 'treat-' + (i + 1), animal: animals[t.animal]._id }));
  const aiAssessments = sampleAiAssessments.map((a, i) => ({ ...a, _id: 'ai-' + (i + 1), animal: animals[a.animal]._id }));
  const alerts = sampleEarlyWarnings.map((w, i) => ({ ...w, _id: 'alert-' + (i + 1), animal: animals[w.animal]._id }));
  const chatHistory = sampleChatHistory.map((c, i) => ({ ...c, _id: 'chat-' + (i + 1), animal: animals[c.animal]._id }));

  // Populate initial baseline summary on each animal
  animals.forEach((a) => {
    const bl = computeAnimalBaseline(a, records, milk);
    a.baseline = {
      avgTemp: bl.avgTemp,
      avgWeight: bl.avgWeight,
      avgMilk: bl.avgMilk,
      usualAppetite: bl.usualAppetite,
      recordCount: bl.recordCount,
      updatedAt: new Date().toISOString(),
    };
  });

  return { animals, records, vaccinations, milk, treatments, aiAssessments, alerts, chatHistory };
}

function loadDb() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        animals: parsed.animals || [],
        records: parsed.records || [],
        vaccinations: parsed.vaccinations || [],
        milk: parsed.milk || [],
        treatments: parsed.treatments || [],
        aiAssessments: parsed.aiAssessments || [],
        alerts: parsed.alerts || [],
        chatHistory: parsed.chatHistory || [],
      };
    }
  } catch { /* corrupted data - reseed */ }
  const db = buildSeed();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  return db;
}
const saveDb = (db) => localStorage.setItem(STORAGE_KEY, JSON.stringify(db));

export function resetDemoData() {
  localStorage.removeItem(STORAGE_KEY);
  loadDb();
}

const required = (body, fields) => {
  for (const [key, label] of Object.entries(fields)) {
    if (body[key] === undefined || body[key] === null || body[key] === '') throw new Error(`${label} is required`);
  }
};

function validateDemo(resource, body, db, id) {
  if (resource === 'animals') {
    required(body, { animalId: 'Animal ID', name: 'Animal name', species: 'Species', breed: 'Breed', age: 'Age', gender: 'Gender', weight: 'Weight', farmName: 'Farm name' });
    if (db.animals.some((a) => a.animalId.toLowerCase() === body.animalId.toLowerCase() && a._id !== id)) throw new Error('Animal ID already exists');
  }
  if (resource === 'records') {
    required(body, { animal: 'Animal', temperature: 'Temperature' });
    if (body.temperature < 30 || body.temperature > 45) throw new Error('Temperature must be between 30 and 45 °C');
  }
  if (resource === 'vaccinations') {
    required(body, { animal: 'Animal', vaccineName: 'Vaccine name', vaccinationDate: 'Vaccination date', nextDueDate: 'Next due date' });
  }
  if (resource === 'milk') {
    required(body, { animal: 'Animal', date: 'Date' });
  }
  if (resource === 'treatments') {
    required(body, { animal: 'Animal', treatment: 'Treatment name', date: 'Date' });
  }
}

function demoList(resource) {
  return loadDb()[resource] || [];
}

function demoCreate(resource, body) {
  const db = loadDb();
  validateDemo(resource, body, db);
  const item = { ...body, _id: uid(), isSample: false, createdAt: new Date().toISOString() };
  if (resource === 'animals') item.healthStatus = item.healthStatus || 'Healthy';
  if (resource === 'records') {
    const animal = db.animals.find((a) => a._id === body.animal);
    if (!animal) throw new Error('Selected animal does not exist');
    item.assessment = assessRecord(body, animal.species);
    animal.healthStatus = levelToStatus(item.assessment.level);
    if (body.weight) animal.weight = body.weight;

    // Evaluate against individual baseline & thresholds -> generate Early Warning Alert
    const priorRecords = db.records.filter((r) => r.animal === animal._id);
    const alertPayload = evaluateEarlyWarning({ animal, newRecord: item, priorRecords });
    if (alertPayload && !db.alerts.some((al) => al.healthRecord === item._id)) {
      db.alerts.unshift({ ...alertPayload, _id: uid(), isSample: false });
    }

    // Recompute baseline on animal
    const bl = computeAnimalBaseline(animal, [item, ...priorRecords], db.milk.filter((m) => m.animal === animal._id));
    animal.baseline = {
      avgTemp: bl.avgTemp,
      avgWeight: bl.avgWeight,
      avgMilk: bl.avgMilk,
      usualAppetite: bl.usualAppetite,
      recordCount: bl.recordCount,
      updatedAt: new Date().toISOString(),
    };
  }
  db[resource].unshift(item);
  saveDb(db);
  return item;
}

function demoUpdate(resource, id, body) {
  const db = loadDb();
  const index = db[resource].findIndex((x) => x._id === id);
  if (index === -1) throw new Error('Record not found');
  validateDemo(resource, body, db, id);
  const updated = { ...db[resource][index], ...body, _id: id };
  if (resource === 'records') {
    const animal = db.animals.find((a) => a._id === updated.animal);
    updated.assessment = assessRecord(updated, animal?.species);
  }
  db[resource][index] = updated;
  saveDb(db);
  return updated;
}

function demoRemove(resource, id) {
  const db = loadDb();
  db[resource] = db[resource].filter((x) => x._id !== id);
  if (resource === 'animals') {
    db.records = db.records.filter((r) => r.animal !== id);
    db.vaccinations = db.vaccinations.filter((v) => v.animal !== id);
    db.milk = db.milk.filter((m) => m.animal !== id);
    db.treatments = db.treatments.filter((t) => t.animal !== id);
    db.aiAssessments = db.aiAssessments.filter((a) => a.animal !== id);
    db.alerts = db.alerts.filter((al) => al.animal !== id);
    db.chatHistory = db.chatHistory.filter((ch) => ch.animal !== id);
  }
  saveDb(db);
}

// ---------------- Public functions used by the app ----------------
export const listAll = async (resource) => (mode === 'api' ? (await http.get(PATHS[resource])).data : demoList(resource));

export const createItem = async (resource, body) => (mode === 'api' ? (await http.post(PATHS[resource], body)).data : demoCreate(resource, body));

export const updateItem = async (resource, id, body) => (mode === 'api' ? (await http.put(`${PATHS[resource]}/${id}`, body)).data : demoUpdate(resource, id, body));

export const removeItem = async (resource, id) => {
  if (mode === 'api') await http.delete(`${PATHS[resource]}/${id}`);
  else demoRemove(resource, id);
};

// ---------------- Early Warning Alert actions ----------------
export async function markAlertReviewed(id, { status = 'Reviewed', reviewNote = '' } = {}) {
  if (mode === 'api') {
    return (await http.patch(`/alerts/${id}/review`, { status, reviewNote })).data;
  }
  const db = loadDb();
  const alert = db.alerts.find((a) => a._id === id);
  if (!alert) throw new Error('Alert not found');
  alert.status = status;
  alert.reviewedAt = status === 'Reviewed' ? new Date().toISOString() : undefined;
  if (reviewNote !== undefined) alert.reviewNote = reviewNote;
  saveDb(db);
  return alert;
}

export async function addAlertFollowUpItem(id, { note, temperature, appetite }) {
  if (!note || !String(note).trim()) throw new Error('Follow-up note is required');
  if (mode === 'api') {
    return (await http.post(`/alerts/${id}/follow-up`, { note, temperature, appetite })).data;
  }
  const db = loadDb();
  const alert = db.alerts.find((a) => a._id === id);
  if (!alert) throw new Error('Alert not found');
  alert.followUps = alert.followUps || [];
  alert.followUps.push({
    note: String(note).trim(),
    temperature: temperature ? Number(temperature) : undefined,
    appetite: appetite || undefined,
    date: new Date().toISOString(),
  });
  saveDb(db);
  return alert;
}

// ---------------- Context-Aware AI Voice Farmer Assistant ----------------
export async function sendContextualAiChat({ animalId, message, language = 'en', contextSnapshot }) {
  if (!message || !String(message).trim()) {
    throw new Error('Please enter or speak a question or symptom description');
  }
  if (mode === 'api') {
    try {
      return (await http.post('/ai/chat', { animal: animalId, message, language, contextSnapshot }, { timeout: 25000 })).data;
    } catch (err) {
      // Only fall back to local context engine if backend route is older/missing or animal ID was out of sync
      if (err.response?.status === 400 && !contextSnapshot?.animal) throw err;
    }
  }
  // Demo / offline / fallback using current in-memory or localStorage context
  await new Promise((r) => setTimeout(r, 500));
  const db = loadDb();
  const animal =
    contextSnapshot?.animal ||
    db.animals.find((a) => a._id === animalId || a.animalId === contextSnapshot?.animal?.animalId);
  if (!animal) throw new Error('Please select an animal');

  const recentRecords =
    contextSnapshot?.recentRecords ||
    db.records
      .filter((r) => r.animal === animal._id)
      .sort((a, b) => new Date(b.observationDate) - new Date(a.observationDate));
  const activeAlerts =
    contextSnapshot?.activeAlerts ||
    db.alerts.filter((al) => al.animal === animal._id && al.status === 'Active');
  const vaccinations =
    contextSnapshot?.vaccinations ||
    db.vaccinations.filter((v) => v.animal === animal._id);
  const milk =
    contextSnapshot?.milk ||
    db.milk.filter((m) => m.animal === animal._id);
  const baseline = computeAnimalBaseline(animal, recentRecords, milk);

  const responseData = buildContextAwareFallbackReply({
    message,
    language,
    animal,
    baseline,
    recentRecords,
    activeAlerts,
    vaccinations,
  });

  const chatEntry = {
    _id: uid(),
    animal: animal._id,
    language,
    userMessage: String(message).trim(),
    assistantReply: responseData.reply,
    riskLevel: responseData.riskLevel,
    supportingRecords: responseData.supportingRecords,
    recommendedSteps: responseData.recommendedSteps,
    vetRecommended: responseData.vetRecommended,
    source: responseData.source,
    createdAt: new Date().toISOString(),
  };
  db.chatHistory.push(chatEntry);
  saveDb(db);
  return { ...responseData, chatId: chatEntry._id, createdAt: chatEntry.createdAt };
}

// Structured AI Health Checker (existing feature)
export async function runAiAssessment(input) {
  const lang = input.language || 'en';
  if (mode === 'api') {
    try {
      return (await http.post('/ai/assess', input, { timeout: 25000 })).data;
    } catch (err) {
      if (err.response?.status === 400) throw err;
      return {
        ...ruleBasedAssessment(input),
        source: 'Rule-based (offline)',
        disclaimer: FALLBACK_NOTES[lang] || FALLBACK_NOTES.en,
      };
    }
  }
  await new Promise((r) => setTimeout(r, 800));
  const res = {
    ...ruleBasedAssessment(input),
    source: 'Rule-based (demo mode)',
    disclaimer: FALLBACK_NOTES[lang] || FALLBACK_NOTES.en,
  };
  if (input.animal) {
    try {
      demoCreate('aiAssessments', {
        animal: input.animal,
        symptoms: input.symptoms || [],
        temperature: input.temperature ? Number(input.temperature) : undefined,
        appetite: input.appetite || 'Normal',
        description: input.description || '',
        language: lang,
        result: res,
        date: new Date().toISOString(),
      });
    } catch { /* ignore */ }
  }
  return res;
}
