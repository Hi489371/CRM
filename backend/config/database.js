const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db';
  const isAtlas = mongoUri.startsWith('mongodb+srv://');

  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const label = isAtlas ? 'MongoDB Atlas' : 'MongoDB';
    console.log(`${label} connected successfully`);
  } catch (error) {
    if (isAtlas) {
      console.error('MongoDB Atlas connection failed.');
      console.error('Check:');
      console.error('  - MONGODB_URI in backend/.env (username, password, cluster host, /crm_db)');
      console.error('  - Atlas Network Access allows your IP (or 0.0.0.0/0 for dev)');
      console.error('  - Database user uolog11_db_user has read/write on crm_db');
      console.error('  - Password has no unencoded special characters in the URI');
    } else {
      console.error('MongoDB connection failed. Is mongod running locally?');
    }
    console.error('Details:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
