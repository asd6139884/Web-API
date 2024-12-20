# 資料接收服務
這是一個用於接收和處理資料的 Web API 服務。該服務提供了安全的資料接收端點，支援單筆和批次資料處理，並實現了完整的資料驗證、日誌記錄和錯誤處理機制。
![image](https://github.com/user-attachments/assets/40fa604d-0074-4ee5-a0c4-6c4e05d1114e)

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
./config/.env
```
編輯 `.env` 檔案，設定以下必要參數：
- `PORT`: 服務執行埠
- `DB_HOST`: 資料庫主機
- `DB_USER`: 資料庫使用者
- `DB_PASSWORD`: 資料庫密碼
- `DB_DATABASE`: 資料庫名稱
- `API_KEY`: API 認證金鑰
- `ALLOWED_IPS`: 允許的 IP 位址列表（以逗號分隔），例如:ALLOWED_IPS=::1, XXX.XXX.XXX.XXX, XXX.XXX.XXX.0/24

4. 啟動服務
測試
```bash
node server.js
```
部署
```bash
pm2 start server.js
```

## API 端點

### 健康檢查
```
GET /health
```
回傳服務狀態和系統資訊。

### 單筆資料接收
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
├── 📁config/
│   └── .env
├── 📁logs/
│   ├── 📁error/
│   └── 📁combined/
├── 📁src/
│   ├── 📁controllers/
│   │   └── IoTDataHandler.js
│   ├── 📁middlewares/
│   │   ├── authenticate.js
│   │   ├── errorHandler.js
│   │   ├── IPWhiteList.js
│   │   ├── logger.js
│   │   └── rateLimiter.js
│   ├── 📁routes/
│   │   ├── health.js
│   │   └── IoTDataRoutes.js
│   ├── 📁utils/
│   │   └── db.js
│   ├── monitor.js
│   └── app.js
└── server.js
```

- **server.js:** 伺服器啟動檔案，負責啟動和配置伺服器。
- 📁src
  - monitor.js: 系統監控模組，包含檢查系統狀態和資料庫連線的函數。
  - app.js: 應用程式主檔案，設定 Express 應用程式和中介軟體。
  - 📁controllers/
    - IoTDataHandler.js: 處理 IoT 資料的控制器，負責業務邏輯。
  - 📁middlewares/
    - authenticate.js: 驗證中介軟體，負責使用者身份驗證。
    - errorHandler.js: 錯誤處理中介軟體，統一處理應用程式中的錯誤。
    - IPWhiteList.js: IP 白名單中介軟體，限制只有特定 IP 可以訪問。
    - logger.js: 日誌中介軟體，記錄請求和錯誤。
    - rateLimiter.js: 限流中介軟體，防止過多請求導致伺服器過載。
  - 📁routes/
    - health.js: 健康檢查路由，提供伺服器狀態檢查端點。
    - IoTDataRoutes.js: IoT 資料相關的路由，定義 API 端點。
  - 📁utils/
    - db.js: 資料庫工具函數，處理資料庫連線和操作。
- 📁config/
  - .env: 環境變數設定檔，用於儲存敏感資訊如資料庫連線字串、API 金鑰等。
- 📁logs/
  - 📁error/: 儲存錯誤日誌。
  - 📁combined/: 儲存綜合日誌，包括錯誤和一般操作日誌。

## 注意事項

1. 請確保設定正確的 IP 白名單
2. API 金鑰應妥善保管，定期更換
3. 監控系統資源使用情況
4. 定期檢查和清理日誌檔案

