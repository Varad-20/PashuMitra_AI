import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/index.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json());

// The frontend calls this to decide between API mode and demo mode
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    gemini: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'),
  });
});

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

async function connectDb() {
  if (!process.env.MONGODB_URI) {
    console.log('MONGODB_URI not set - running without database (frontend will use demo mode).');
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 4000 });
    console.log('MongoDB connected');
  } catch (err) {
    console.log('MongoDB connection failed - frontend will use demo mode.', err.message);
  }
}

app.listen(PORT, () => console.log(`PashuMitra AI server running on http://localhost:${PORT}`));
connectDb();
