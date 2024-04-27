const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

//user schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide your name."],
  },
  email: {
    type: String,
    required: [true, "Please provide your email."],
    unique: true,
    lowercase: true,
    match: [/.+\@.+\..+/, "Please provide a valid email address."],
  },
  password: {
    type: String,
    required: [true, "Please provide your password."],
    minlength: 8,
    maxlength: 60,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  role: {
    type: String,
    enum: ["admin", "pr_manager", "developer"],
    default: "developer",
  },
  verified: {
    type: Boolean,
    default: false,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetTokenExpires: Date,
  emailVerificationToken: String,
  emailVerificationTokenExpires: Date,
  lastVerificationAttemptAt: Date,
});

userSchema
  .virtual("confirmPassword")
  .get(function () {
    return this._confirmPassword;
  })
  .set(function (value) {
    this._confirmPassword = value;
  });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.createEmailVerificationToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.emailVerificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000);

  return resetToken;
};

//! creating email verificaton token

//! creating reset password token
userSchema.methods.createResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetTokenExpires = new Date(Date.now() + 10 * 60 * 1000);

  return resetToken;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
