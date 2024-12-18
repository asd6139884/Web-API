const mysql = require('mysql2');
const logger = require('../logger/loggerInstance'); // 引入 logger 實例
require('dotenv').config({ path: './config/.env' });


const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 監聽資料庫連線成功事件
pool.on('connection', (connection) => {
  logger.info('Database connection established', {
    threadId: connection.threadId,
    timestamp: new Date().toISOString()
  });
});

// 監聽資料庫錯誤事件
pool.on('error', (err) => {
  logger.error('Database connection error', {
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });
});

// 測試資料庫連線
const testDatabaseConnection = async () => {
  try {
    const connection = await pool.promise().getConnection();
    logger.info('Database connection test successful');
    connection.release(); // 釋放連線
  } catch (err) {
    logger.error('Database connection test failed', {
      message: err.message,
      stack: err.stack
    });
    throw err; // 拋出錯誤以便在初始化過程中處理
  }
};

// 初始化資料庫連線
const initializeDatabase = async () => {
  try {
    await testDatabaseConnection();
    logger.info('Database initialized successfully');
  } catch (err) {
    logger.error('Failed to initialize database', {
      message: err.message,
      stack: err.stack
    });
    process.exit(1); // 終止進程以防止應用程序在無法連接資料庫的情況下運行
  }
};

// 在模組導出之前初始化資料庫
initializeDatabase();


module.exports = pool.promise();
