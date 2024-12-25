// ==========================
// IP 過濾中介軟體
// ==========================
const logger = require('../logger/loggerInstance');
const NodeCache = require('node-cache');
const ipRangeCheck = require('ip-range-check');
require('dotenv').config({ path: './config/.env' });


// 創建 IP 快取，設定 5 分鐘過期
const ipCache = new NodeCache({ stdTTL: 300 });

// IP 地址格式驗證函數
function isValidIP(ip) {
    // IPv4 驗證
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    // IPv6 驗證 (基本格式)
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    // IPv4 映射的 IPv6 驗證
    const ipv4MappedIpv6Regex = /^::ffff:(\d{1,3}\.){3}\d{1,3}$/;

    // 檢查本地 IP 地址
    const localIPs = ['::1'];
    
    if (!ip) return false;
    if (localIPs.includes(ip)) return true; // 本地 IP 地址視為有效
    return ipv4Regex.test(ip) || ipv6Regex.test(ip) || ipv4MappedIpv6Regex.test(ip);
}

const allowedRanges = (process.env.ALLOWED_IPS || '').split(',').map(range => range.trim()).filter(Boolean);
// const allowedRanges = new Set((process.env.ALLOWED_IPS || '').split(',').filter(Boolean)); //當數據大的時候，將其轉換為 Set 以提高查詢效率

// 在啟動時檢查白名單配置
if (allowedRanges.length === 0) {
    logger.warn('IP 白名單為空，所有請求都會被拒絕');
}

// IP 白名單中介軟體
function ipWhiteprocess(req, res, next) {
    try {
        const clientIP = req.ip;

        // 檢查是否能獲取客戶端 IP
        if (!clientIP) {
            logger.error('無法取得客戶端 IP');
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Cannot determine client IP'
            });
        }

        // 檢查 IP 格式是否有效
        if (!isValidIP(clientIP)) {
            logger.error('無效的 IP 格式', { ip: clientIP });
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid IP format'
            });
        }

        // 檢查快取
        const cachedResult = ipCache.get(clientIP);
        if (cachedResult !== undefined) {
            if (cachedResult) {
                return next();
            } else {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'Access denied (cached result)'
                });
            }
        }

        // 檢查 IP 是否在允許的範圍內
        const isAllowed = allowedRanges.some(range => {
            try {
                return ipRangeCheck(clientIP, range);
            } catch (error) {
                logger.error('IP 範圍檢查錯誤', { 
                    ip: clientIP, 
                    range, 
                    error: error.message 
                });
                return false;
            }
        });

        // 設定快取
        ipCache.set(clientIP, isAllowed);
        if (isAllowed) {
            logger.info('允許訪問的 IP', { 
                ip: clientIP, 
                method: req.method, 
                url: req.originalUrl 
            });
            return next();
        }

        // 記錄並拒絕未授權的訪問
        logger.error('拒絕訪問的 IP', {
            ip: clientIP,
            method: req.method,
            url: req.originalUrl,
            headers: req.headers,
            timestamp: new Date().toISOString()
        });

        return res.status(403).json({
            error: 'Forbidden',
            message: 'Access denied'
        });

    } catch (error) {
        logger.error('IP 白名單檢查失敗', { 
            error: error.message,
            stack: error.stack 
        });
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to process request'
        });
    }
}

module.exports = { ipWhiteprocess };

