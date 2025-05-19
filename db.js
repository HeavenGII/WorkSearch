const { Pool } = require('pg');

const getDbConfig = () => {
  if (process.env.NODE_ENV === 'production') {
    // Для Railway - используем только DATABASE_URL из переменных окружения
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    };
  }
  
  // Для локальной разработки
  return {
    user: "postgres",
    password: "31052022",
    host: "127.0.0.1",
    port: 5432,
    database: "WorkSearch",
    ssl: false
  };
};

const pool = new Pool(getDbConfig());

// Улучшенная обработка ошибок
pool.on('error', (err) => {
  console.error('Unexpected DB error:', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => {
    console.log('Executing query:', text);
    return pool.query(text, params);
  }
};