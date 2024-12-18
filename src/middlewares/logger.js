const logger = require('../logger/loggerInstance');

// 請求日誌中介軟體
const requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.http('HTTP Request', {
        method: req.method,
        url: req.originalUrl,
        // url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
      });
    });
    next();
  };

// 錯誤日誌中介軟體
const errorLogger = (err, req, res, next) => {
    logger.error('Unhandled Error', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next(err); // 傳遞到全局錯誤處理
  };

  module.exports = { requestLogger, errorLogger };