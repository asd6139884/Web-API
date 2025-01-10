const db = require('../utils/db');
const logger = require('../logger/loggerInstance');
require('dotenv').config(); // 確保環境變數已加載

// 獲取資料表名稱
const datatable = process.env.DB_TABLE;

// 解析 TransDesc 和 TransValue
const parseTransData = (transDesc, transValue) => {
    const result = {};
    if (transDesc && transValue) {
        const descArray = transDesc.split(';');
        const valueArray = transValue.split(';');
        
        descArray.forEach((field, index) => {
            result[field] = valueArray[index] !== undefined ? valueArray[index] : null;
        });
    }
    return result;
};

// IoT資料驗證函數
const validateIoTData = (data) => {
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

// 單筆資料處理
const saveOrUpdateIoTData = async (data) => {
    // 驗證資料
    const validationErrors = validateIoTData(data);
    if (validationErrors.length > 0) {
        logger.warn('資料驗證失敗', { errors: validationErrors, data });
        throw { status: 400, message: validationErrors.join(', ') };
    }

    const { CarNo, GPSTime, TransDesc, TransValue, ...dataWithoutTrans } = data; // 使用解構賦值提取資料
    const extraFields = parseTransData(TransDesc, TransValue); // 解析 TransDesc 和 TransValue
    const combinedData = { ...dataWithoutTrans, ...extraFields }; // 合併資料

    // 檢查資料是否存在
    const checkSql = `SELECT * FROM ${datatable} WHERE CarNo = ? AND GPSTime = ?`;
    const [results] = await db.query(checkSql, [CarNo, GPSTime]);

    if (results.length > 0) { // 資料存在，進行更新
        // 動態生成更新的欄位和值
        let updateFields = [];
        let updateValues = [];
        for (const [key, value] of Object.entries(combinedData)) {    
            if (value !== undefined) {
                updateFields.push(`${key} = ?`);
                updateValues.push(value);
            }
        }

        // 加入條件參數
        updateValues.push(CarNo, GPSTime);
        
        // 檢查是否有需要更新的欄位
        if (updateFields.length === 0) {
            return { message: '沒有需要更新的欄位' };
        }

        // 動態生成的更新 SQL 語句
        const updateSql = `
            UPDATE ${datatable}
            SET ${updateFields.join(', ')}
            WHERE CarNo = ? AND GPSTime = ?
        `;

        await db.query(updateSql, updateValues);
            logger.info('資料已成功更新');
            return { message: '資料已成功更新' };

    } else { // 資料不存在，進行新增
        const allData = { CarNo, GPSTime, ...combinedData }; // 合併所有資料
        const fields = Object.keys(allData); // 取得所有欄位名稱
        const placeholders = fields.map(() => '?').join(', '); // 生成佔位符

        // 動態生成插入 SQL 語句
        const insertSql = `
            INSERT INTO ${datatable} (${fields.join(', ')})
            VALUES (${placeholders})
        `;

        // 取得所有欄位的值
        const insertValues = fields.map(field => 
            allData[field] !== undefined ? allData[field] : null
        );

        const [result] = await db.query(insertSql, insertValues);
        logger.info('資料已成功儲存');
        return { message: '資料已成功儲存', id: result.insertId };
    }
};

// 批次資料處理
const batchSaveIoTData = async (dataArray) => {
    // 驗證所有資料
    const validationErrors = [];
    const processedData = dataArray.map((data, index) => {
        const errors = validateIoTData(data);
        if (errors.length > 0) {
            validationErrors.push({ index, errors });
        }
        const { CarNo, GPSTime, TransDesc, TransValue, ...dataWithoutTrans } = data;
        const extraFields = parseTransData(TransDesc, TransValue);
        const combinedData = { ...dataWithoutTrans, ...extraFields };
        return { CarNo, GPSTime, ...combinedData };
    });

    if (validationErrors.length > 0) {
        logger.warn('批次資料驗證失敗', { errors: validationErrors });
        throw { status: 400, message: '資料驗證失敗', errors: validationErrors };
    }

    const fields = Object.keys(processedData[0]); // 用第一筆資料取得所有欄位名稱

    // 準備批次插入的值
    const values = processedData.map(data => 
        fields.map(field => data[field] !== undefined ? data[field] : null) // 為每個欄位生成對應的值，如果值為 undefined，則設為 null。
    );

    // 動態生成批次插入 SQL 語句
    const insertSql = `
        INSERT INTO ${datatable} (${fields.join(', ')})
        VALUES ?
        ON DUPLICATE KEY UPDATE
        ${fields
            .filter(field => field !== 'CarNo' && field !== 'GPSTime')
            .map(field => `${field} = VALUES(${field})`)
            .join(',\n        ')}
    `;

    const [result] = await db.query(insertSql, [values]);
    logger.info('批次資料儲存成功', { 
        affectedRows: result.affectedRows,
        changedRows: result.changedRows
    });
    return { 
        message: '批次儲存成功',
        affectedRows: result.affectedRows,
        changedRows: result.changedRows
    };
};

module.exports = { saveOrUpdateIoTData, batchSaveIoTData };
