import 'dotenv/config';
import mongoose from 'mongoose';
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
import { assessRecord } from '../utils/assess.js';
import { computeAnimalBaseline } from '../utils/intelligence.js';
import {
  sampleAnimals,
  sampleRecords,
  sampleVaccinations,
  sampleMilkRecords,
  sampleTreatments,
  sampleAiAssessments,
  sampleEarlyWarnings,
  sampleChatHistory,
} from './seedData.js';

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error('Set MONGODB_URI in backend/.env first.');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  await Promise.all([
    Animal.deleteMany({}),
    HealthRecord.deleteMany({}),
    Vaccination.deleteMany({}),
    MilkRecord.deleteMany({}),
    Treatment.deleteMany({}),
    AiAssessment.deleteMany({}),
    EarlyWarningAlert.deleteMany({}),
    AiChatMessage.deleteMany({}),
  ]);

  const animals = await Animal.insertMany(sampleAnimals);
  const records = sampleRecords.map((r) => ({
    ...r,
    animal: animals[r.animal]._id,
    assessment: assessRecord(r, animals[r.animal].species),
  }));
  const insertedRecords = await HealthRecord.insertMany(records);
  await Vaccination.insertMany(sampleVaccinations.map((v) => ({ ...v, animal: animals[v.animal]._id })));
  const insertedMilk = await MilkRecord.insertMany(sampleMilkRecords.map((m) => ({ ...m, animal: animals[m.animal]._id })));
  await Treatment.insertMany(sampleTreatments.map((t) => ({ ...t, animal: animals[t.animal]._id })));
  await AiAssessment.insertMany(sampleAiAssessments.map((a) => ({ ...a, animal: animals[a.animal]._id })));
  await EarlyWarningAlert.insertMany(sampleEarlyWarnings.map((w) => ({ ...w, animal: animals[w.animal]._id })));
  await AiChatMessage.insertMany(sampleChatHistory.map((c) => ({ ...c, animal: animals[c.animal]._id })));

  // Compute and store initial baselines on each animal document
  for (const animal of animals) {
    const bl = computeAnimalBaseline(animal, insertedRecords, insertedMilk);
    animal.baseline = {
      avgTemp: bl.avgTemp,
      avgWeight: bl.avgWeight,
      avgMilk: bl.avgMilk,
      usualAppetite: bl.usualAppetite,
      recordCount: bl.recordCount,
      updatedAt: new Date(),
    };
    await animal.save();
  }

  console.log(
    `Seeded ${animals.length} animals, ${records.length} health records, ${sampleVaccinations.length} vaccinations, ${sampleMilkRecords.length} milk records, ${sampleTreatments.length} treatments, ${sampleEarlyWarnings.length} early warnings.`
  );
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
