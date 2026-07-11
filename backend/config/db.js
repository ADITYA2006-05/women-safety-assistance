const { Sequelize } = require('sequelize');

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URI;
let sequelize = null;
let isConnected = false;

if (dbUrl) {
  const sslRequired = dbUrl.includes('sslmode=require') || 
                      dbUrl.includes('render.com') || 
                      dbUrl.includes('supabase') || 
                      dbUrl.includes('neon.tech') || 
                      process.env.DB_SSL === 'true';

  sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    logging: false, // set to console.log to see SQL queries in dev
    dialectOptions: sslRequired ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {}
  });
  global.useInMemoryDb = false;
} else {
  console.warn('\n⚠️  No DATABASE_URL or POSTGRES_URI found in environment variables.');
  if (process.env.VERCEL) {
    console.error('❌ ERROR: Database URL is required on Vercel serverless deployments! In-memory fallbacks do not persist user data across requests.');
  }
  console.warn('⚠️  Falling back to IN-MEMORY DATABASE. Data will not persist across restarts.\n');
  global.useInMemoryDb = true;
}

const connectDB = async () => {
  if (global.useInMemoryDb || !sequelize) return null;
  if (isConnected) return sequelize;
  try {
    await sequelize.authenticate();
    
    // Attempt to enable PostGIS extension
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    console.log('✅ Connected to PostgreSQL successfully (PostGIS checked).');
    
    // Sync models
    await sequelize.sync({ alter: true });
    console.log('✅ PostgreSQL database schema synced.');
    
    isConnected = true;
    return sequelize;
  } catch (error) {
    console.error(`❌ PostgreSQL connection error: ${error.message}`);
    if (process.env.VERCEL) {
      console.error('❌ ERROR: PostgreSQL connection failed on Vercel! In-memory fallbacks do not persist user data across requests.');
    }
    console.warn('⚠️  Falling back to IN-MEMORY DATABASE. Data will not persist across restarts.\n');
    global.useInMemoryDb = true;
    return null;
  }
};

module.exports = {
  connectDB,
  sequelize
};
