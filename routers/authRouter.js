const express = require("express");
const authController = require("../controllers/authController");
const User = require("../models/userSchema");
const { check, body } = require("express-validator/check");
const router = express.Router();

//http://localhost:8080/api/
router.get("/", authController.test);

//http://localhost:8080/api/signUp
router.post(
  "/signUp",
  [
    check("name").trim().notEmpty().withMessage("Please enter your name"),
    check("email")
      .trim()
      .notEmpty()
      .isEmail()
      .normalizeEmail()
      .withMessage("please enter a valid email address")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((user) => {
          if (user) {
            return Promise.reject(
              "Already have an account. Please try a different Email"
            );
          }
        });
      }),
    check("contactNumber")
      .trim()
      .isNumeric()
      .isLength({ min: 10 })
      .withMessage("please enter a valid contact number"),
    check("password")
      .isLength({ min: 8 })
      .isAlphanumeric()
      .withMessage(
        "password must be atleast 8 characters long with a number and a letter"
      ),
    check("address").trim().notEmpty().withMessage("please enter your address"),
  ],
  authController.signUp
);

//http://localhost:8080/api/signIn
router.post(
  "/signIn",
  [
    check("email")
      .trim()
      .notEmpty()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid Email"),
    check("password")
      .trim()
      .notEmpty()
      .isLength({ min: 8 })
      .isAlphanumeric()
      .withMessage("Please enter a valid password"),
  ],
  authController.signIn
);

//http://localhost:8080/api/forgot
router.post(
  "/forgot",
  check("email")
    .trim()
    .notEmpty()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please enter a valid Email")
    .custom((value, { req }) => {
      return User.findOne({ email: value }).then((user) => {
        if (!user) {
          return Promise.reject("No such email address.");
        }
      });
    }),
  authController.forgotPassword
);

//http://localhost:8080/api/reset-password
router.patch(
  "/reset-password/:resetToken",
  [
    check("email")
      .trim()
      .notEmpty()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid Email"),
    check("password")
      .trim()
      .notEmpty()
      .isLength({ min: 8 })
      .isAlphanumeric()
      .withMessage("Please enter a valid password"),
  ],
  authController.changePasswoed
);

module.exports = router;
