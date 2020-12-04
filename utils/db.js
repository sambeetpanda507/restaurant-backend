const mongoose = require("mongoose");
require("dotenv").config();
const db = mongoose.connect(process.env.DATABASE_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

module.export = db;
