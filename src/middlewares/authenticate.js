// ==========================
// 認證中介軟體
// ==========================
const logger = require('../logger/loggerInstance');
require('dotenv').config({ path: './config/.env' });

// 命名函數（Named Function）寫法
function authenticate(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.API_KEY) {
        logger.error('未授權的訪問嘗試', { ip: req.ip });
        return res.status(401).json({ message: '未授權的訪問' });
    }
    next();
}

module.exports = authenticate;



// 匿名函數（Anonymous Function）寫法
// module.exports = (req, res, next) => {
//     const apiKey = req.headers['x-api-key'];
//     if (apiKey !== process.env.API_KEY) {
//         logger.error('未授權的訪問嘗試', { ip: req.ip });
//         return res.status(401).json({ message: '未授權的訪問' });
//     }
//     next();
// };


