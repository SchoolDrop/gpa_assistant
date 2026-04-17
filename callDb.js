import mongoose from "mongoose";
let cachedDb = null;

export const callDb = async () => {
  if (cachedDb && cachedDb.connection.readyState === 1) {
    return cachedDb;
  }

  cachedDb = await mongoose.connect(process.env.MONGO_URL, {
    family: 4,
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 5000,
    bufferCommands: false,
  });
  return cachedDb;
};
