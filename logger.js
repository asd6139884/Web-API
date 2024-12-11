const winston = require('winston');
require('winston-daily-rotate-file');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

// 定義日誌等級
const logLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white'
  }
};

// 確保日誌目錄存在
const createLogDirectories = () => {
  const dirs = ['logs', 'logs/error', 'logs/combined'];
  dirs.forEach(dir => {
    const logDirectory = path.join(__dirname, dir);
    if (!fs.existsSync(logDirectory)) {
      fs.mkdirSync(logDirectory, { recursive: true });
    }
  });
};

createLogDirectories();

// 自定義日誌格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
        format: () => moment().tz('Asia/Taipei').format('YYYY-MM-DD HH:mm:ss')
      }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(info => {
    const { timestamp, level, message, ...meta } = info;
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaStr}`;
  })
);

// 定義日誌傳輸器
const transports = [
  // 錯誤日誌
  new winston.transports.DailyRotateFile({
    filename: path.join(__dirname, 'logs/error/%DATE%-error.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: logFormat,
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true
  }),
  
  // 組合日誌
  new winston.transports.DailyRotateFile({
    filename: path.join(__dirname, 'logs/combined/%DATE%-combined.log'),
    datePattern: 'YYYY-MM-DD',
    format: logFormat,
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true
  })
];

// 在開發環境添加控制台輸出
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  );
}

// 創建 logger 實例
const logger = winston.createLogger({
  levels: logLevels.levels,
  format: logFormat,
  transports
});

// 添加輔助方法
logger.logAndThrow = (level, message, error) => {
  logger.log(level, message, { error });
  throw error;
};

logger.logWithContext = (level, message, context = {}) => {
  logger.log(level, message, {
    ...context,
    timestamp: moment().tz('Asia/Taipei').format('YYYY-MM-DD HH:mm:ss'),
    environment: process.env.NODE_ENV,
    processId: process.pid
  });
};

// 添加請求日誌中間件
logger.requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('user-agent'),
      ip: req.ip
    });
  });
  next();
};

// 添加錯誤日誌中間件
logger.errorLogger = (err, req, res, next) => {
  logger.error('Unhandled Error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params
  });
  next(err);
};

// 監控系統資源使用
setInterval(() => {
  const used = process.memoryUsage();
  logger.debug('System Resources', {
    memory: {
      heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
      rss: `${Math.round(used.rss / 1024 / 1024)} MB`
    },
    uptime: process.uptime()
  });
}, 300000); // 每5分鐘記錄一次

// 添加優雅關閉
process.on('SIGTERM', () => {
  logger.info('Service shutting down');
  process.exit(0);
});

module.exports = logger;