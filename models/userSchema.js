const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    contactNumber: {
      type: Number,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    emailToken: String,
    emailTokenExpiration: Date,
  },
  { timestamps: true }
);
module.exports = mongoose.model("users", userSchema);
