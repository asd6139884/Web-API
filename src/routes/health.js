const express = require('express');
const logger = require('../logger/loggerInstance');
const { getSystemInfo, checkDatabaseConnection } = require('../monitor');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const dbStatus = await checkDatabaseConnection(); // 簡單測試資料庫連線
        const healthcheck = {
            uptime: process.uptime(),
            database: dbStatus ? 'UP' : 'DOWN',
            message: 'OK',
            timestamp: Date.now(),
            systemInfo: await getSystemInfo() // 取得系統詳細資訊
        };
        res.send(healthcheck);
    } catch (error) {
        logger.error('健康檢查失敗', { error });
        res.status(503).send({ message: '服務不可用', error: error.message });
    }
});

module.exports = router;
