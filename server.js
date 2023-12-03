const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const cors = require('cors');
const connection = require('./database');
const errorMiddleware = require('./Middleware/error');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cloudinary = require('cloudinary');
const fileUpload = require('express-fileupload');

// Handling Uncaught Exception********************************************************************************
process.on('uncaughtException', (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting down the server due to Uncaught Exception`);
  process.exit(1);
});

//connection**************************************************************************************************
connection();

//config
dotenv.config({ path: 'backend/.env' });

//cloudinary******************************************************************************************************
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.APIKEY,
  api_secret: process.env.APISECRETKEY,
});

//middlewares************************************************************************************************
app.use(express.json());
app.use(
  cors({
    option: '*',
  })
);
app.use(cookieParser());
// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// Parse application/json
app.use(bodyParser.json());
app.use(fileUpload());

//for routes************************************************************************************************
const product = require('./routes/product');
const user = require('./routes/users');
const category = require('./routes/categoryRoutes');
const order = require('./routes/orderRoute');

app.use('/api/v1', product);
app.use('/api/log', user);
app.use('/api/v1', category);
app.use('/api/ord', order);

//Errors Middleware******************************************************************************************
app.use(errorMiddleware);

const server = app.listen(process.env.PORT, () => {
  console.log(`Listening on http://localhost:${process.env.PORT}`);
});

// Unhandled Promise Rejection
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting down the server due to Unhandled Promise Rejection`);

  server.close(() => {
    process.exit(1);
  });
});
