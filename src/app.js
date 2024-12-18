const express = require('express');

// const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');

const rateLimiter = require('./middlewares/rateLimiter');
const { ipWhiteprocess } = require('./middlewares/IPWhiteList'); // 引入 IP 白名單中介軟體
const authenticate = require('./middlewares/authenticate');
const { requestLogger, errorLogger } = require('./middlewares/logger');
const errorHandler = require('./middlewares/errorHandler');

const iotDataRoutes = require('./routes/IoTDataRoutes');
const healthRoutes = require('./routes/health');

// 初始化應用
const app = express();

// ==========================
// 全局中介軟體
// ==========================
app.use(helmet()); // 安全性增強
// app.use(cors());
app.use(cors({
    origin: '*',
    methods: ['POST'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));
app.use(express.json());
// app.use(bodyParser.json({ limit: '10kb' })); // 限制請求體大小
app.use(ipWhiteprocess); // 在所有路由之前使用，確保只有白名單的 IP 可以繼續執行。

app.use(requestLogger); // 日誌中介軟體

// ==========================
// 業務邏輯路由
// ==========================
app.use(rateLimiter); // API 請求限流
app.use('/api/', authenticate); // API 身份驗證
app.use('/api/iot-data', iotDataRoutes); // 將 IoT 資料路由放在 /api/ 路由下
app.use('/health', healthRoutes); // 健康檢查路由

// 測試根路由
app.get('/', (req, res) => {
    res.send('Web API 運行中');
});

// ==========================
// 錯誤中介軟體
// ==========================
app.use(errorLogger);
app.use(errorHandler); // 全局錯誤處理

// ==========================
// 優雅關閉
// ==========================
process.on('SIGTERM', () => {
    logger.info('Service shutting down');
    process.exit(0);
});

module.exports = app;
