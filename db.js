const { Pool } = require('pg');

// Жестко прописываем ЛОКАЛЬНЫЕ настройки
const pool = new Pool({
  user: "postgres",
  password: "31052022",
  host: "127.0.0.1", // Важно использовать IPv4
  port: 5432,
  database: "WorkSearch",
  ssl: false
});

// Проверка подключения
pool.query('SELECT NOW()')
  .then(res => console.log('✅ Локальная PostgreSQL подключена:', res.rows[0].now))
  .catch(err => {
    console.error('❌ Ошибка подключения к ЛОКАЛЬНОЙ БД');
    console.error('Проверьте:');
    console.error('1. Запущен ли сервер PostgreSQL (через services.msc)');
    console.error('2. Совпадают ли логин/пароль в db.js и вашей БД');
    console.error('3. Открыт ли порт 5432 (команда: netstat -ano | findstr 5432)');
    console.error('Подробности ошибки:', err.message);
    process.exit(1); // Завершаем процесс при ошибке
  });

module.exports = pool;