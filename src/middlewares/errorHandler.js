const logger = require('../logger/loggerInstance');

function errorHandler(err, req, res, next) {
    const statusCode = err.status || 500;

    logger.error('Unhandled error', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query,
        params: req.params,
    });

    // 根據環境生成錯誤回應
    const errorResponse = {
        message: statusCode === 500 ? 'Internal Server Error' : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    };

    res.status(statusCode).json(errorResponse);
}

module.exports = errorHandler;