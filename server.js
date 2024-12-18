const app = require('./src/app');
const logger = require('./src/logger/loggerInstance'); // 引入 logger 實例
const { requestLogger } = require('./src/middlewares/logger');
require('dotenv').config({ path: './config/.env' });


const PORT = process.env.PORT || 3000;
// console.log('PORT:', process.env.PORT);

app.use(requestLogger); // 使用 requestLogger

// 啟動伺服器
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});
