# Web-API
通過網路提供的 API 服務給外部系統傳送數據到內部

## 功能說明
### 安全性
1. 速率限制配置：
  - 功能：限制每個 IP 在 m 分鐘內最多 k 個請求。
  - 說明：這個功能可以防止惡意攻擊（如 DDoS 攻擊）和濫用 API。使用中介軟體 express-rate-limit 來實現這個功能。
2. 認證中介軟體：
  - 功能：需要 API key，才能進行訪問。
  - 說明：這個功能確保只有授權用戶才能訪問你的 API。你可以使用中介軟體來檢查請求頭中的 API key。
3. 中介軟體helmet
  - 功能：增強安全性，Helmet 包含多個小型中介軟體，每個中介軟體負責設置特定的安全標頭。
  - 說明：設置 HTTP 響應標頭來防止常見的網絡攻擊，如 XSS、點擊劫持和 MIME 類型嗅探。

### 資料處理
1. 資料驗證函數：
  - 功能：將資料做檢查。
  - 說明：這個功能確保輸入的資料符合預期格式和要求。(後續規劃使用庫 Joi 來進行資料驗證。)

### 資料儲存
1. 單筆資料儲存/更新：
  - 功能：儲存/更新單筆資料。
  - 說明：這個功能將單筆資料儲存/更新到資料庫中。
2. 批次資料儲存：
  - 功能：批次儲存多筆資料。
  - 說明：這個功能將多筆資料一次性儲存到資料庫中，通常用於提高效率。

### 日誌紀錄
1. Winston：
  - 功能：記錄應用程式的各種日誌，包括錯誤日誌、HTTP 請求日誌和系統資源使用情況。
  - 說明：Winston 是一個多功能的日誌記錄庫，支持多種日誌傳輸器（如文件、控制台、遠程伺服器等），並且可以根據日誌等級進行分類和過濾。它提供了靈活的配置選項和自定義格式，適合用於記錄應用程式的操作和錯誤，幫助開發者和運維人員追蹤和分析應用程式的運行情況。
2. Morgan：
  - 功能：記錄 HTTP 請求日誌。
  - 說明：Morgan 是一個 HTTP 請求日誌中介軟體，用於記錄每個進入伺服器的 HTTP 請求的詳細資訊，包括請求方法、URL、狀態碼、響應時間等。這些日誌有助於監控伺服器的流量、分析請求模式、排查問題和進行性能優化。Morgan 通常與其他日誌記錄工具（如 Winston）結合使用，以提供全面的日誌管理功能。
<!--  log 檔紀錄：
  - 功能：記錄應用程式的操作日誌。
  - 說明：這個功能有助於追蹤應用程式的操作和錯誤。使用 winston 來實現。-->

### 系統監控
1. 健康檢查端點
  - 功能：檢查伺服器的運行狀態和健康狀況。
  - 說明：這個端點提供伺服器的運行時間、記憶體使用情況、CPU 使用情況和當前時間戳等資訊，有助於開發者和運維人員快速了解伺服器是否正常運行。
