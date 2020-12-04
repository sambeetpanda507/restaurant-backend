const User = require("../models/userSchema");
const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.APP_EMAIL,
    pass: process.env.APP_PASSWORD,
  },
});

module.exports.test = (req, res, next) => {
  res.status(200).send("Hello world");
};

module.exports.signUp = async (req, res, next) => {
  try {
    //checking validation error
    const error = validationResult(req);
    if (!error.isEmpty()) {
      const err = new Error();
      err.msg = error.array()[0].msg;
      err.statusCode = 422;
      err.param = error.array()[0].param;
      throw err;
    }
    const { name, email, password, contactNumber, address } = req.body;
    //encrypting password
    const hashedPassword = await bcrypt.hash(password, 12);

    if (hashedPassword) {
      //saving to db
      const user = new User({
        name: name,
        email: email,
        password: hashedPassword,
        contactNumber: contactNumber,
        address: address,
      });
      const userData = await user.save();
      if (!userData) {
        const error = new Error();
        error.msg = "unable to save user data to the database";
        error.statusCode = 500;
        throw error;
      } else {
        res.status(200).json({ msg: "successfully signed up" });
      }
    } else {
      const error = new Error();
      err.statusCode = 500;
      err.msg = "encryption error";
      throw error;
    }
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

module.exports.signIn = async (req, res, next) => {
  try {
    //checking validation error
    const error = validationResult(req);
    if (!error.isEmpty()) {
      const err = new Error();
      err.msg = error.array()[0].msg;
      err.statusCode = 422;
      err.param = error.array()[0].param;
      throw err;
    }
    const { email, password } = req.body;

    const user = await User.findOne({ email: email });

    if (!user) {
      const error = new Error();
      error.msg = "please enter a valid email or password";
      error.statusCode = 401;
      throw error;
    }

    const isValidUser = await bcrypt.compare(password, user.password);

    if (!isValidUser) {
      const error = new Error();
      error.msg = "please enter a valid email or password";
      error.statusCode = 401;
      throw error;
    }
    //TODO: jwt integration
    const token = jwt.sign(
      {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res
      .status(200)
      .cookie("jwt", token, {
        sameSite: "strict",
        path: "/",
        expires: new Date(Date.now() + 1000 * 60 * 60),
        httpOnly: true,
        // secure: true,
      })
      .json({ name: user.name, email: user.email });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

module.exports.forgotPassword = async (req, res, next) => {
  try {
    //checking validation error
    const error = validationResult(req);
    if (!error.isEmpty()) {
      const err = new Error();
      err.msg = error.array()[0].msg;
      err.statusCode = 422;
      err.param = error.array()[0].param;
      throw err;
    }
    const { email } = req.body;

    //validation email

    const user = await User.findOne({ email: email });

    if (!user) {
      const error = new Error();
      error.msg = "Please enter a valid email address";
      err.statusCode = 403;
      throw error;
    }

    crypto.randomBytes(32, (err, buffer) => {
      if (err) {
        const error = new Error();
        error.msg = "Internal server error";
        err.statusCode = 500;
        throw error;
      }
      const token = buffer.toString("hex");

      User.updateOne(
        { email: email },
        {
          $set: {
            emailToken: token,
            emailTokenExpiration: new Date(Date.now() + 15 * 60 * 1000),
          },
        }
      ).then((result) => {
        if (!result) {
          const error = new Error();
          error.msg = "Internal server error";
          err.statusCode = 500;
          throw error;
        }
        transporter
          .sendMail({
            from: process.env.APP_EMAIL,
            to: email,
            subject: "password reset request",
            html: `<p>You have requested for the password reset.</p><p> Click <a href='http://localhost:3000/change-password/${token}'>here</a> to reset password</p>`,
          })
          .then((mail) => {
            if (!mail) {
              const error = new Error();
              error.msg = "Internal server error";
              err.statusCode = 500;
              throw error;
            }
            res.status(200).json({
              message: "Please check your email to change your password.",
            });
          })
          .catch((error) => {
            if (!error.statusCode) {
              error.statusCode = 500;
            }
            next(error);
          });
      });
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

module.exports.changePasswoed = async (req, res, next) => {
  try {
    const error = validationResult(req);

    if (!error.isEmpty()) {
      const err = new Error();
      err.msg = error.array()[0].msg;
      err.statusCode = 422;
      err.param = error.array()[0].param;
      throw err;
    }

    const { email, password } = req.body;
    const { resetToken } = req.params;

    //email validation
    const user = await User.findOne({
      email: email,
      emailToken: resetToken,
      emailTokenExpiration: {
        $gt: Date.now(),
      },
    });

    if (!user) {
      const error = new Error();
      error.msg = "Invalid email or link has expired";
      error.statusCode = 403;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    if (!hashedPassword) {
      const error = new Error();
      error.msg = "Internal server error";
      error.statusCode = 500;
      throw error;
    }

    user.password = hashedPassword;
    user.emailToken = "";
    user.emailTokenExpiration = Date.now();
    const updatedUser = user.save();
    if (!updatedUser) {
      const error = new Error();
      error.msg = "Internal server error";
      error.statusCode = 500;
      throw error;
    }

    res.status(201).json({ msg: "Password reset successful" });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};
