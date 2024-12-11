const express = require('express');
const { saveOrUpdateGpsData, batchSaveGpsData } = require('./gpsDataHandler'); // 引用 gpsDataHandler.js
const logger = require('./logger'); // 引用 logger.js
const bodyParser = require('body-parser');
const cors = require('cors');
const os = require('os');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
// const swaggerUi = require('swagger-ui-express');
// const swaggerDocument = require('./swagger.json');
require('dotenv').config();

const app = express();
const PORT = 3000;

// 獲取伺服器的 IP 地址
function getServerIPAddress() {
    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {
        const addresses = networkInterfaces[interfaceName];
        for (const addressInfo of addresses) {
            if (addressInfo.family === 'IPv4' && !addressInfo.internal) {
                return addressInfo.address;
            }
        }
    }
    return '127.0.0.1'; // 如果沒有找到其他 IP，則默認為 localhost
}

const serverIP = getServerIPAddress();

// 速率限制配置
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分鐘
    max: 100, // 限制每個 IP 15分鐘內最多 100 個請求
    message: '請求次數過多，請稍後再試'
});

// 認證中介軟體
const authenticate = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.API_KEY) {
        logger.warn('未授權的訪問嘗試', { ip: req.ip });
        return res.status(401).json({ message: '未授權的訪問' });
    }
    next();
};

// 中介軟體
app.use(helmet()); // 安全性增強
app.use(cors());
app.use(bodyParser.json({ limit: '10kb' })); // 限制請求體大小
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use('/api/', limiter);
app.use('/api/', authenticate);
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 系統監控資訊
const getSystemInfo = () => ({
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
});

// 健康檢查端點
app.get('/health', (req, res) => {
    try {
        const healthcheck = {
            uptime: process.uptime(),
            message: 'OK',
            timestamp: Date.now(),
            systemInfo: getSystemInfo()
        };
        res.send(healthcheck);
    } catch (error) {
        logger.error('健康檢查失敗', { error });
        res.status(503).send({ message: '服務不可用', error: error.message });
    }
});

// 接收外部資料並儲存至 MySQL
app.post('/api/gps_data', (req, res) => {
    saveOrUpdateGpsData(req.body, (err, result) => {
        if (err) {
            // 記錄失敗的相關資訊，包括錯誤原因和請求內容
            logger.error('儲存或更新資料失敗', { 
                error: err.message, 
                stack: err.stack, 
                requestData: req.body 
            });
            return res.status(err.status || 500).send({ message: err.message, error: err.error });
        }
        res.status(200).send(result);
    });
});

// 批次接收資料端點
app.post('/api/gps_data/batch', (req, res) => {
    if (!Array.isArray(req.body)) {
        return res.status(400).send({ message: '請求體必須是陣列' });
    }

    batchSaveGpsData(req.body, (err, result) => {
        if (err) {
            logger.error('批次儲存資料失敗', { 
                error: err.message, 
                stack: err.stack,
                requestData: req.body 
            });
            return res.status(500).send({ message: '批次儲存失敗', error: err.message });
        }
        res.status(200).send({ message: '批次儲存成功', result });
    });
});

// 測試根路由
app.get('/', (req, res) => {
    res.send('Web API 運行中');
});

// 全局錯誤處理
app.use((err, req, res, next) => {
    logger.error('未處理的錯誤', { 
        error: err.message, 
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    res.status(500).send('伺服器內部錯誤');
});

// 啟動伺服器
app.listen(PORT, () => {
    logger.info(`伺服器正在 http://${serverIP}:${PORT} 上運行`);
});
