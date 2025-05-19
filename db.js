const { Pool } = require('pg');

const pool = new Pool({
  user: "postgres",
  password: "31052022",
  host: "127.0.0.1", // Обязательно IPv4-адрес
  port: 5432,
  database: "WorkSearch",
  ssl: false,
  connectionTimeoutMillis: 5000
});

// Проверка подключения при старте
pool.query('SELECT NOW()')
  .then(res => console.log('✅ PostgreSQL 17 подключена:', res.rows[0].now))
  .catch(err => {
    console.error('❌ Ошибка подключения:');
    console.error('Проверьте пароль и наличие БД WorkSearch');
    console.error('Подробности:', err.message);
    process.exit(1);
  });

module.exports = pool;