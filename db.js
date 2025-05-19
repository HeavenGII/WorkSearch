const { Pool } = require('pg');

const getDbConfig = () => {
  // Для локальной разработки
  if (process.env.NODE_ENV !== 'production') {
    return {
      user: "postgres",
      password: "31052022",
      host: "127.0.0.1",
      port: 5432,
      database: "WorkSearch",
      ssl: false
    };
  }

  // Для продакшена (Railway)
  try {
    const dbUrl = new URL(process.env.DATABASE_URL);
    return {
      user: dbUrl.username,
      password: dbUrl.password,
      host: dbUrl.hostname,
      port: dbUrl.port,
      database: dbUrl.pathname.slice(1),
      ssl: { rejectUnauthorized: false }
    };
  } catch (err) {
    console.error('❌ Invalid DATABASE_URL:', process.env.DATABASE_URL);
    console.error('Error:', err.message);
    process.exit(1);
  }
};

const pool = new Pool(getDbConfig());

// Проверка подключения при старте
pool.query('SELECT NOW()')
  .then(res => console.log('✅ PostgreSQL connected at:', res.rows[0].now))
  .catch(err => {
    console.error('❌ DB connection failed!');
    console.error('Configuration:', {
      host: getDbConfig().host,
      port: getDbConfig().port,
      database: getDbConfig().database
    });
    console.error('Error details:', err.message);
    
    if (process.env.NODE_ENV === 'production') {
      process.exit(1); // Завершаем процесс в production
    }
  });

module.exports = pool;