import mongoose from 'mongoose';

const { Schema } = mongoose;

export const SPECIES = ['Cow', 'Buffalo', 'Goat', 'Sheep'];
export const HEALTH_STATUS = ['Healthy', 'Needs Attention', 'Critical'];
export const VACCINE_STATUS = ['Completed', 'Due Soon', 'Overdue'];

const animalSchema = new Schema(
  {
    animalId: { type: String, required: [true, 'Animal ID is required'], unique: true, trim: true },
    name: { type: String, required: [true, 'Animal name is required'], trim: true },
    species: { type: String, enum: { values: SPECIES, message: 'Invalid species' }, required: true },
    breed: { type: String, required: [true, 'Breed is required'], trim: true },
    age: { type: Number, required: [true, 'Age is required'], min: [0, 'Age cannot be negative'], max: 40 },
    gender: { type: String, enum: ['Male', 'Female'], required: true },
    weight: { type: Number, required: [true, 'Weight is required'], min: [1, 'Weight must be positive'] },
    farmName: { type: String, required: [true, 'Farm name is required'], trim: true },
    healthStatus: { type: String, enum: HEALTH_STATUS, default: 'Healthy' },
    baseline: {
      avgTemp: { type: Number, default: null },
      avgWeight: { type: Number, default: null },
      avgMilk: { type: Number, default: null },
      usualAppetite: { type: String, default: 'Normal' },
      recordCount: { type: Number, default: 0 },
      updatedAt: { type: Date },
    },
    dateAdded: { type: Date, default: Date.now },
    isSample: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const healthRecordSchema = new Schema(
  {
    animal: { type: Schema.Types.ObjectId, ref: 'Animal', required: [true, 'Animal is required'] },
    temperature: { type: Number, required: [true, 'Temperature is required'], min: [30, 'Temperature too low'], max: [45, 'Temperature too high'] },
    weight: { type: Number, min: 1 },
    appetite: { type: String, enum: ['Normal', 'Low', 'No appetite'], default: 'Normal' },
    activity: { type: String, enum: ['Normal', 'Low'], default: 'Normal' },
    symptoms: { type: [String], default: [] },
    notes: { type: String, default: '' },
    observationDate: { type: Date, default: Date.now },
    assessment: {
      level: { type: String, enum: ['Normal', 'Attention', 'High Priority'], default: 'Normal' },
      reasons: { type: [String], default: [] },
    },
    isSample: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const vaccinationSchema = new Schema(
  {
    animal: { type: Schema.Types.ObjectId, ref: 'Animal', required: [true, 'Animal is required'] },
    vaccineName: { type: String, required: [true, 'Vaccine name is required'], trim: true },
    vaccinationDate: { type: Date, required: [true, 'Vaccination date is required'] },
    nextDueDate: { type: Date, required: [true, 'Next due date is required'] },
    status: { type: String, enum: VACCINE_STATUS, default: 'Completed' },
    isSample: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Milk production: one record per animal per day (date kept as 'YYYY-MM-DD' text)
const milkSchema = new Schema(
  {
    animal: { type: Schema.Types.ObjectId, ref: 'Animal', required: [true, 'Animal is required'] },
    date: { type: String, required: [true, 'Date is required'], match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'] },
    morning: { type: Number, default: 0, min: [0, 'Morning milk cannot be negative'] },
    evening: { type: Number, default: 0, min: [0, 'Evening milk cannot be negative'] },
    pricePerLitre: { type: Number, default: 0, min: [0, 'Price cannot be negative'] },
    feedExpense: { type: Number, default: 0, min: [0, 'Feed expense cannot be negative'] },
    isSample: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const treatmentSchema = new Schema(
  {
    animal: { type: Schema.Types.ObjectId, ref: 'Animal', required: [true, 'Animal is required'] },
    treatment: { type: String, required: [true, 'Treatment name is required'], trim: true },
    details: { type: String, default: '' },
    vetName: { type: String, default: '' },
    date: { type: Date, required: [true, 'Treatment date is required'] },
    isSample: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Saved AI health assessments (shown in the animal's health passport)
const aiAssessmentSchema = new Schema(
  {
    animal: { type: Schema.Types.ObjectId, ref: 'Animal', required: [true, 'Animal is required'] },
    symptoms: { type: [String], default: [] },
    temperature: Number,
    appetite: String,
    description: { type: String, default: '' },
    language: { type: String, default: 'en' },
    result: { type: Schema.Types.Mixed, required: true },
    date: { type: Date, default: Date.now },
    isSample: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Early Health Warning alerts (generated from baseline + threshold comparisons)
const earlyWarningAlertSchema = new Schema(
  {
    animal: { type: Schema.Types.ObjectId, ref: 'Animal', required: [true, 'Animal is required'] },
    healthRecord: { type: Schema.Types.ObjectId, ref: 'HealthRecord', index: true },
    riskLevel: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
    detectedChange: { type: String, required: true },
    reason: { type: String, required: true },
    previousValue: {
      temperature: { type: String, default: '—' },
      appetite: { type: String, default: 'Normal' },
      weight: { type: String, default: '—' },
    },
    currentValue: {
      temperature: { type: String, default: '—' },
      appetite: { type: String, default: 'Normal' },
      weight: { type: String, default: '—' },
    },
    recommendedAction: { type: String, required: true },
    status: { type: String, enum: ['Active', 'Reviewed'], default: 'Active' },
    reviewedAt: { type: Date },
    reviewNote: { type: String, default: '' },
    followUps: [
      {
        note: { type: String, required: true },
        temperature: { type: Number },
        appetite: { type: String },
        date: { type: Date, default: Date.now },
      },
    ],
    isSample: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Context-aware AI Voice Assistant conversation history
const aiChatMessageSchema = new Schema(
  {
    animal: { type: Schema.Types.ObjectId, ref: 'Animal', required: [true, 'Animal is required'] },
    language: { type: String, enum: ['en', 'hi', 'mr'], default: 'en' },
    userMessage: { type: String, required: true },
    assistantReply: { type: String, required: true },
    riskLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
    supportingRecords: { type: [String], default: [] },
    recommendedSteps: { type: [String], default: [] },
    vetRecommended: { type: Boolean, default: false },
    source: { type: String, default: 'Context-Aware Rule Engine' },
    isSample: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const EarlyWarningAlert = mongoose.model('EarlyWarningAlert', earlyWarningAlertSchema);
export const AiChatMessage = mongoose.model('AiChatMessage', aiChatMessageSchema);
export const MilkRecord = mongoose.model('MilkRecord', milkSchema);
export const Treatment = mongoose.model('Treatment', treatmentSchema);
export const AiAssessment = mongoose.model('AiAssessment', aiAssessmentSchema);
export const Animal = mongoose.model('Animal', animalSchema);
export const HealthRecord = mongoose.model('HealthRecord', healthRecordSchema);
export const Vaccination = mongoose.model('Vaccination', vaccinationSchema);
