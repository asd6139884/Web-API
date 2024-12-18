const rateLimit = require('express-rate-limit');
const logger = require('../logger/loggerInstance');

module.exports = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分鐘時間窗口
    max: 100, // 最大請求數
    message: '請求次數過多，請稍後再試', // 回傳給使用者的訊息
    standardHeaders: true, // 回傳 RateLimit 頭部資訊
    legacyHeaders: false, // 停用 X-RateLimit-* 頭部 (舊版格式)

    // 當達到請求限制時執行的處理函數
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
          ip: req.ip,
          method: req.method,
          url: req.originalUrl,
          userAgent: req.get('user-agent')
      });

      // 返回限制訊息
      res.status(429).json({
          message: '請求次數過多，請稍後再試',
          status: 429
      });
  },

  // 選擇性：跳過某些條件的請求，例如失敗的請求
  skipFailedRequests: true
});
