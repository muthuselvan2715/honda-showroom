import mongoose from 'mongoose';

export const connectDB = async (uriOverride) => {
  const uri = uriOverride || process.env.MONGODB_URI;

  if (!uri) {
    console.error('CRITICAL: MONGODB_URI environment variable is missing.');
    console.error('Please configure your MongoDB Atlas connection string in backend/.env');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    console.log(`[MongoDB] Database name: ${conn.connection.name}`);
    return true;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    return false;
  }
};

export const checkDbConnection = () => {
  return mongoose.connection.readyState === 1; // 1 = connected
};
