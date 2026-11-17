import mongoose from 'mongoose';

export const validateObjectId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }
  next();
};

// Make sure the database is connected before handling data requests
export const requireDb = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Database is not connected. Use demo mode or configure MONGODB_URI.' });
  }
  next();
};

export const notFound = (req, res) => res.status(404).json({ message: `Route not found: ${req.originalUrl}` });

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: errors.join(', '), errors });
  }
  if (err.code === 11000) return res.status(409).json({ message: 'Animal ID already exists' });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid value for ' + err.path });
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
};
