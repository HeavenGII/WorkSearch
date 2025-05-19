const { Pool } = require('pg');

// Универсальная конфигурация для локального и продакшен окружения
const poolConfig = process.env.NODE_ENV === 'production'
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    }
  : {
      user: "postgres",
      password: "31052022",
      host: "127.0.0.1",
      port: 5432,
      database: "WorkSearch",
      ssl: false
    };

const pool = new Pool(poolConfig);

// Улучшенная проверка подключения
pool.query('SELECT NOW()')
  .then(() => console.log('✅ DB connected successfully'))
  .catch(err => {
    console.error('❌ DB connection failed:');
    console.error('Mode:', process.env.NODE_ENV || 'development');
    console.error('Config:', poolConfig);
    console.error('Error:', err.message);
  });

module.exports = pool;