import { Database } from 'sqlite3';

// Создание подключения к базе данных SQLite
const db = new Database('./blockchain-lavka.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Создание таблиц при запуске
db.serialize(() => {
  // Создание таблицы пользователей
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
    } else {
      console.log('Users table created or already exists.');
    }
  });

  // Создание таблицы транзакций
  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    exchange_id TEXT UNIQUE NOT NULL,
    from_currency TEXT NOT NULL,
    to_currency TEXT NOT NULL,
    amount_from REAL NOT NULL,
    amount_to REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`, (err) => {
    if (err) {
      console.error('Error creating transactions table:', err.message);
    } else {
      console.log('Transactions table created or already exists.');
    }
  });

  // Создание таблицы сессий
  db.run(`CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`, (err) => {
    if (err) {
      console.error('Error creating sessions table:', err.message);
    } else {
      console.log('Sessions table created or already exists.');
    }
  });

  // Создание таблицы заявок на покупку
  db.run(`CREATE TABLE IF NOT EXISTS buy_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    request_id TEXT UNIQUE NOT NULL,
    crypto_type TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    operator_id INTEGER,
    payment_details TEXT,
    receipt_image TEXT,
    transaction_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (operator_id) REFERENCES users (id)
  )`, (err) => {
    if (err) {
      console.error('Error creating buy_requests table:', err.message);
    } else {
      console.log('Buy requests table created or already exists.');
    }
  });

  // Создание таблицы споров
  db.run(`CREATE TABLE IF NOT EXISTS disputes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id TEXT,
    user_id INTEGER,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    FOREIGN KEY (request_id) REFERENCES buy_requests (request_id),
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`, (err) => {
    if (err) {
      console.error('Error creating disputes table:', err.message);
    } else {
      console.log('Disputes table created or already exists.');
    }
  });

  // Создание таблицы настроек
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    markup_percentage REAL DEFAULT 1.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating settings table:', err.message);
    } else {
      console.log('Settings table created or already exists.');
      
      // Добавляем запись по умолчанию, если таблица пуста
      db.get('SELECT COUNT(*) as count FROM settings', (err, row: any) => {
        if (!err && row.count === 0) {
          db.run('INSERT INTO settings (markup_percentage) VALUES (1.0)', (err) => {
            if (err) {
              console.error('Error inserting default settings:', err.message);
            } else {
              console.log('Default settings inserted.');
            }
          });
        }
      });
    }
  });
});

// Функция для генерации уникального ID заявки
export function generateRequestId() {
  return 'BR' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase();
}

export default db;