const db = require('./utils/db');

// 測試資料庫連線是否正常
const checkDatabaseConnection = async () => {
    try {
        const [rows] = await db.query('SELECT 1'); // 輕量的連線測試
        return rows.length > 0; // 若連線成功，回傳 true
    } catch (err) {
        console.error('Database connection error:', err);
        return false; // 若發生錯誤，回傳 false
    }
};

// 取得系統資訊
const getSystemInfo = async () => {
    const dbStatus = await checkDatabaseConnection();
    return {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        dbStatus: dbStatus ? 'OK' : 'ERROR' // 資料庫狀態
    };
};

module.exports = { getSystemInfo, checkDatabaseConnection };

