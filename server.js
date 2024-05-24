const express = require('express');
const cors = require('cors');
const multer = require('multer');
const upload = multer();

const app = express();

app.use(cors({
    origin: 'http://localhost:5050',
}));


//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(upload.array());


//routers 
const router = require('./routes/homeRoutes');
app.use('/api', router);


//port
const PORT = process.env.PORT || 8080;


//server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
