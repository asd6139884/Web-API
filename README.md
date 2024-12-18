# IoT GPS 資料接收服務

這是一個用於接收和處理 IoT 設備 GPS 資料的 Web API 服務。該服務提供了安全的資料接收端點，支援單筆和批次資料處理，並實現了完整的資料驗證、日誌記錄和錯誤處理機制。

## 功能特點

### 安全性
- IP 白名單驗證
- API 金鑰認證
- Helmet 安全性增強
- 請求速率限制
- CORS 保護

### 資料處理
- 單筆資料接收和更新
- 批次資料處理
- 資料驗證和錯誤處理
- MySQL 資料庫儲存

### 監控和日誌
- 詳細的系統監控
- 健康檢查端點
- 多層級日誌記錄
  - HTTP 請求日誌
  - 錯誤日誌
  - 應用程式日誌
- 日誌檔案自動輪替

## 系統需求

- Node.js >= 14.x
- MySQL >= 8.x
- npm >= 6.x

## 安裝步驟

1. 複製專案
```bash
git clone [repository-url]
cd [project-name]
```

2. 安裝依賴
```bash
npm install
```

3. 設定環境變數
```bash
cp config/.env.example config/.env
```
編輯 `.env` 檔案，設定以下必要參數：
- `PORT`: 服務執行埠
- `DB_HOST`: 資料庫主機
- `DB_USER`: 資料庫使用者
- `DB_PASSWORD`: 資料庫密碼
- `DB_DATABASE`: 資料庫名稱
- `API_KEY`: API 認證金鑰
- `ALLOWED_IPS`: 允許的 IP 位址列表（以逗號分隔）

4. 啟動服務
```bash
npm start
```

## API 端點

### 健康檢查
```
GET /health
```
回傳服務狀態和系統資訊。

### IoT 資料接收
```
POST /api/iot-data
Content-Type: application/json
x-api-key: [your-api-key]
```

請求體範例：
```json
{
    "CarNo": "ABC123",
    "GPSTime": "2024-01-01 12:00:00",
    "Position_lat": 25.1234,
    "Position_lon": 121.5678,
    "Speed": 60.5,
    "Angle": 180,
    "Sat": 8
}
```

### 批次資料接收
```
POST /api/iot-data/batch
Content-Type: application/json
x-api-key: [your-api-key]
```

請求體範例：
```json
[
    {
        "CarNo": "ABC123",
        "GPSTime": "2024-01-01 12:00:00",
        "Position_lat": 25.1234,
        "Position_lon": 121.5678
    },
    {
        "CarNo": "XYZ789",
        "GPSTime": "2024-01-01 12:00:00",
        "Position_lat": 25.4321,
        "Position_lon": 121.8765
    }
]
```

## 資料欄位說明

| 欄位名稱 | 類型 | 必填 | 說明 |
|----------|------|------|------|
| CarNo | string | 是 | 車輛編號 |
| GPSTime | datetime | 是 | GPS 時間戳記 |
| Position_lat | decimal | 否 | 緯度 (-90 到 90) |
| Position_lon | decimal | 否 | 經度 (-180 到 180) |
| Speed | decimal | 否 | 速度 (km/h) |
| Angle | decimal | 否 | 方向角度 |
| Mileage | decimal | 否 | 里程數 |
| TotalMileage | decimal | 否 | 總里程數 |
| Sat | integer | 否 | 衛星數量 (0 到 50) |
| GPSAV | integer | 否 | GPS 可用性狀態 |
| CarStatus | integer | 否 | 車輛狀態碼 |

## 錯誤處理

服務會回傳標準的 HTTP 狀態碼：

- 200: 請求成功
- 400: 請求格式錯誤或資料驗證失敗
- 401: 未授權（API 金鑰錯誤）
- 403: 禁止訪問（IP 不在白名單中）
- 429: 請求過於頻繁
- 500: 伺服器內部錯誤

## 日誌管理

日誌檔案位置：
- 錯誤日誌: `logs/error/YYYY-MM-DD-error.log`
- 綜合日誌: `logs/combined/YYYY-MM-DD-combined.log`

日誌特性：
- 自動按日期分割
- 14 天自動輪替
- 超過 20MB 自動分割
- 自動壓縮歸檔

## 效能考量

- 資料庫連線池限制：10 個連線
- 請求速率限制：每 15 分鐘 100 次
- 記憶體使用監控
- CPU 使用監控

## 專案結構

```
.
├── config/
│   └── .env
├── logs/
│   ├── error/
│   └── combined/
├── src/
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   ├── utils/
│   └── app.js
└── server.js
```

## 注意事項

1. 請確保設定正確的 IP 白名單
2. API 金鑰應妥善保管，定期更換
3. 監控系統資源使用情況
4. 定期檢查和清理日誌檔案

