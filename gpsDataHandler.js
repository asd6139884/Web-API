const db = require('./db');
const logger = require('./logger'); // 引用 logger.js

// GPS 資料驗證函數
const validateGpsData = (data) => {
    const errors = [];
    
    // 檢查必填欄位
    if (!data.CarNo || !data.GPSTime) {
        errors.push('CarNo 和 GPSTime 是必填欄位');
    }

    // 檢查座標範圍
    if (data.Position_lat !== undefined) {
        const lat = parseFloat(data.Position_lat);
        if (isNaN(lat) || lat < -90 || lat > 90) {
            errors.push('緯度超出有效範圍 (-90 到 90)');
        }
    }

    if (data.Position_lon !== undefined) {
        const lon = parseFloat(data.Position_lon);
        if (isNaN(lon) || lon < -180 || lon > 180) {
            errors.push('經度超出有效範圍 (-180 到 180)');
        }
    }
    
    // 檢查速度是否為非負數
    if (data.Speed !== undefined) {
        const speed = parseFloat(data.Speed);
        if (isNaN(speed) || speed < 0) {
            errors.push('速度不能為負數');
        }
    }

    // 檢查衛星數量是否合理
    if (data.Sat !== undefined) {
        const sat = parseInt(data.Sat);
        if (isNaN(sat) || sat < 0 || sat > 50) {
            errors.push('衛星數量超出合理範圍 (0 到 50)');
        }
    }

    return errors;
};

const saveOrUpdateGpsData = (data, callback) => {
    // 驗證資料
    const validationErrors = validateGpsData(data);
    if (validationErrors.length > 0) {
        logger.warn('資料驗證失敗', { errors: validationErrors, data });
        return callback({ status: 400, message: validationErrors.join(', ') });
    }

    const { CarNo, GPSTime, CarStatus, GPSAV, Position_lon, Position_lat, Speed, Angle, Mileage, TotalMileage, Sat } = data;

    // 檢查資料是否存在
    const checkSql = 'SELECT * FROM gps_data WHERE CarNo = ? AND GPSTime = ?';
    db.query(checkSql, [CarNo, GPSTime], (err, results) => {
        if (err) {
            logger.error('資料庫錯誤', { error: err });
            return callback({ status: 500, message: '檢查資料失敗', error: err });
        }

        if (results.length > 0) {
            // 資料存在，動態生成更新語句
            let updateFields = [];
            let updateValues = [];

            const fieldsToUpdate = {
                CarStatus, GPSAV, Position_lon, Position_lat,
                Speed, Angle, Mileage, TotalMileage, Sat
            };

            for (const [key, value] of Object.entries(fieldsToUpdate)) {
                if (value !== undefined) {
                    updateFields.push(`${key} = ?`);
                    updateValues.push(value);
                }
            }

            // 加入條件參數
            updateValues.push(CarNo, GPSTime);

            if (updateFields.length === 0) {
                return callback(null, { message: '沒有需要更新的欄位' });
            }

            // 動態生成的更新 SQL 語句
            const updateSql = `
                UPDATE gps_data 
                SET ${updateFields.join(', ')}
                WHERE CarNo = ? AND GPSTime = ?
            `;

            db.query(updateSql, updateValues, (err, result) => {
                if (err) {
                    logger.error('資料庫錯誤', { error: err });
                    return callback({ status: 500, message: '更新失敗', error: err });
                }
                logger.info('資料已成功更新', { CarNo, GPSTime });
                callback(null, { message: '資料已成功更新' });
            });
        } else {
            // 資料不存在，進行新增
            const insertSql = `
                INSERT INTO gps_data (CarNo, GPSTime, CarStatus, GPSAV, Position_lon, Position_lat, Speed, Angle, Mileage, TotalMileage, Sat)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const insertValues = [
                CarNo, GPSTime, CarStatus || null, GPSAV || null,
                Position_lon || null, Position_lat || null, Speed || null,
                Angle || null, Mileage || null, TotalMileage || null, Sat || null
            ];

            db.query(insertSql, insertValues, (err, result) => {
                if (err) {
                    logger.error('資料庫錯誤', { error: err });
                    return callback({ status: 500, message: '儲存失敗', error: err });
                }
                logger.info('資料已成功儲存', { CarNo, GPSTime, id: result.insertId });
                callback(null, { message: '資料已成功儲存', id: result.insertId });
            });
        }
    });
};

// 批次資料處理
const batchSaveGpsData = async (dataArray, callback) => {
    // 驗證所有資料
    const validationErrors = [];
    dataArray.forEach((data, index) => {
        const errors = validateGpsData(data);
        if (errors.length > 0) {
            validationErrors.push({ index, errors });
        }
    });

    if (validationErrors.length > 0) {
        logger.warn('批次資料驗證失敗', { errors: validationErrors });
        return callback({ status: 400, message: '資料驗證失敗', errors: validationErrors });
    }

    // 準備批次插入的值
    const values = dataArray.map(data => [
        data.CarNo,
        data.GPSTime,
        data.CarStatus || null,
        data.GPSAV || null,
        data.Position_lon || null,
        data.Position_lat || null,
        data.Speed || null,
        data.Angle || null,
        data.Mileage || null,
        data.TotalMileage || null,
        data.Sat || null
    ]);

    const insertSql = `
        INSERT INTO gps_data (
            CarNo, GPSTime, CarStatus, GPSAV, Position_lon,
            Position_lat, Speed, Angle, Mileage, TotalMileage, Sat
        ) VALUES ?
        ON DUPLICATE KEY UPDATE
        CarStatus = VALUES(CarStatus),
        GPSAV = VALUES(GPSAV),
        Position_lon = VALUES(Position_lon),
        Position_lat = VALUES(Position_lat),
        Speed = VALUES(Speed),
        Angle = VALUES(Angle),
        Mileage = VALUES(Mileage),
        TotalMileage = VALUES(TotalMileage),
        Sat = VALUES(Sat)
    `;

    db.query(insertSql, [values], (err, result) => {
        if (err) {
            logger.error('批次儲存失敗', { error: err });
            return callback({ status: 500, message: '批次儲存失敗', error: err });
        }
        logger.info('批次資料儲存成功', { 
            affectedRows: result.affectedRows,
            changedRows: result.changedRows
        });
        callback(null, { 
            message: '批次儲存成功',
            affectedRows: result.affectedRows,
            changedRows: result.changedRows
        });
    });
};

module.exports = { saveOrUpdateGpsData, batchSaveGpsData };
