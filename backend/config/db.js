import mongoose from "mongoose";

const DEFAULT_RETRY_ATTEMPTS = 5;
const DEFAULT_RETRY_DELAY_MS = 2000;

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    const msg = 'MONGO_URI is not set in environment';
    console.error(msg);
    if (process.env.NODE_ENV === 'production') process.exit(1);
    return;
  }

  const maxAttempts = parseInt(process.env.MONGO_CONNECT_RETRIES || DEFAULT_RETRY_ATTEMPTS, 10);
  const retryDelay = parseInt(process.env.MONGO_CONNECT_RETRY_DELAY_MS || DEFAULT_RETRY_DELAY_MS, 10);

  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      attempt += 1;
      console.log(`Attempting MongoDB connection (attempt ${attempt}/${maxAttempts})...`);
      await mongoose.connect(mongoUri, {
        // Use sensible timeouts so failures surface quickly
        serverSelectionTimeoutMS: 5000,
      });
      console.log('MongoDB connected');
      return;
    } catch (err) {
      console.error(`MongoDB connection error (attempt ${attempt}):`, err.message || err);
      if (attempt >= maxAttempts) break;
      await new Promise((res) => setTimeout(res, retryDelay * attempt));
    }
  }

  // If we reached here, connection wasn't established
  const finalMsg = 'Failed to connect to MongoDB after multiple attempts.';
  console.error(finalMsg);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  } else {
    console.warn('Continuing without database connection (development mode).');
  }
};

export default connectDB;
