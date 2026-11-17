import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/index.js';

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Allow requests from desktop localhost AND any mobile/tablet device on the local network
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || !allowedOrigins.length || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Also allow private LAN IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x) so Android devices on Wi-Fi can connect
      if (/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
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

app.listen(PORT, HOST, () => console.log(`PashuMitra AI server running on http://${HOST}:${PORT}`));
connectDb();
