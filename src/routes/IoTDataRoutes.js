// ==========================
// IoT 資料相關路由
// ==========================
const express = require('express');
const { saveOrUpdateIoTData, batchSaveIoTData } = require('../controllers/IoTDataHandler');
const logger = require('../logger/loggerInstance');
const router = express.Router();

// 單筆接收資料端點
router.post('/', async (req, res) => {
    try {
        logger.info('接收到的完整資料', { requestData: req.body });

        const result = await saveOrUpdateIoTData(req.body);
        res.status(200).json(result);
    } catch (err) {
        logger.error('儲存或更新資料失敗', { 
            error: err.message,
            stack: err.stack,
            requestData: req.body
        });
        res.status(err.status || 500).json({ message: err.message, error: err.error });
    }
});

// 批次接收資料端點
router.post('/batch', async (req, res) => {
    if (!Array.isArray(req.body)) {
        return res.status(400).json({ message: '請求體必須是陣列' });
    }

    try {
        const result = await batchSaveIoTData(req.body);
        res.status(200).json({ message: '批次儲存成功', result });
    } catch (err) {
        logger.error('批次儲存資料失敗', { 
            error: err.message,
            stack: err.stack,
            requestData: req.body
        });
        res.status(500).json({ message: '批次儲存失敗', error: err.message });
    }
});

module.exports = router;