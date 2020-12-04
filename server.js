const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const authRouter = require("./routers/authRouter");
const database = require("./utils/db");
require("dotenv").config();

const port = process.env.PORT;
const app = express();
app.use(helmet());
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/api", authRouter);

app.use((error, req, res, next) => {
  res.status(error.statusCode).json({
    message: error,
  });
});

const connect = async () => {
  try {
    const dbConnection = await database;
    const serverConnection = await app.listen(port);
    if (dbConnection && serverConnection) {
      console.log(
        `database connected | server listening on port : http://localhost:${port}`
      );
    }
  } catch (error) {
    console.log(error);
  }
};

connect();
