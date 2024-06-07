const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const upload = multer();
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const app = express();
const https = require('https');

app.use(cors({
    origin: 'http://localhost:5050',
}));

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
// const privateKey = fs.readFileSync('server.key');
// const certificate = fs.readFileSync('server.cert');


//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(upload.array());
//app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: accessLogStream }));

//routers 
const router = require('./routes/homeRoutes');
app.use('/api', router);


//port
const PORT = process.env.PORT || 8080;

// const httpsServer = https.createServer({ key: privateKey, cert: certificate }, app);

// // Start server
// httpsServer.listen(PORT, () => {
//     console.log(`HTTPS Server is running on port ${PORT}`);
// });
//server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
