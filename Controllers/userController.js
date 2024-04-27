const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../Models/userModel");
const sendEmail = require("../emailSend");
const addToMailchimpList = require("../addToMailchimpList");

const { reset } = require("nodemon");
const moment = require("moment");
const crypto = require("crypto");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

//! signup
exports.signup = async (req, res, next) => {
  const { name, email, password, confirmPassword, role, verified } = req.body;

  try {
    const newUser = await User.create({
      name,
      email,
      password,
      confirmPassword,
      role,
      verified,
    });

    //generate token for verification
    const verificationToken = newUser.createEmailVerificationToken();
    await newUser.save({ validateBeforeSave: false });

    const verifyUrl = `${req.protocol}://localhost:5173/verifyEmail/${verificationToken}`;

    const message = `Thank you for registering with us!
To finalize your account creation, we kindly ask you to verify your email address by clicking on the following link:
${verifyUrl}.
This one-time verification process ensures the security of your account
and helps us maintain the integrity of our services.

If you encounter any issues or have any questions, please don't hesitate to contact our support team at [Support Email].

Thank you for choosing us. We look forward to serving you!`;

    await sendEmail({
      email: newUser.email,
      subject: "Complete Your Account Setup: One-Time Email Verification Link",
      text: message,
    });

    res.status(201).json({
      status: "success",
      data: {
        user: newUser,
        message:
          "Verification email sent. Please check your email to verify your account.",
      },
    });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern && err.keyPattern.email === 1) {
      return res.status(400).json({
        status: "fail",
        message: "The provided email address is already in use.",
      });
    } else if (err.name === "ValidationError") {
      // Validation error
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({
        status: "fail",
        message: messages.join(". "),
      });
    } else {
      // Other errors
      console.error(err);
      res.status(500).json({
        status: "error",
        message: "An error occurred during registration.",
      });
    }
  }
};

//! login
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      status: "fail",
      message: "The email address or password is not provided.",
    });
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({
      status: "fail",
      message: "Invalid email address or password!",
    });
  }

  if (!user.verified) {
    return res.status(401).json({
      status: "fail",
      message: "Please verify your email address before logging in.",
    });
  }

  const token = signToken(user._id);

  const userForResponse = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  res.status(200).json({
    status: "success",
    user: userForResponse,
    token,
  });
};

//! logout
exports.logout = (req, res) => {
  res.status(200).json({
    status: "success",
    message: "You have been successfully logged out.",
  });
};

//? fetching users
exports.getAllUsers = async (req, res) => {
  try {
    const searchQuery = {};

    if (req.query.name) {
      searchQuery.name = { $regex: req.query.name, $options: "i" };
    }

    if (req.query.email) {
      searchQuery.email = { $regex: req.query.email, $options: "i" };
    }

    const users = await User.find(searchQuery).select("name email role");

    res.status(200).json({
      status: "success",
      results: users.length,
      data: {
        users,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err,
    });
  }
};

//? deleting users
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User with the following ID not found.",
      });
    }
    res.status(200).json({
      status: "success",
      message: "User successfully deleted.",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "An unexpected error occurred while deleting the user.",
    });
  }
};

//? updating role
exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newRole } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role: newRole },
      { new: true }
    );

    res.status(200).json({
      status: "success",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error updating user role.",
    });
  }
};

//? updating password
exports.updatePassword = async (req, res, next) => {
  const { userId, currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 8 || newPassword.length > 60) {
    return res.status(400).json({
      status: "fail",
      message: "Password must be between 8 and 60 characters.",
    });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Current password does not match." });
    }

    user.password = newPassword;
    user.passwordChangedAt = Date.now();
    await user.save();
    res.status(200).json({
      status: "success",
      message: "Password updated successfully.",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message:
        "An error occurred while updating the password. " + error.message,
    });
  }
};

//? forgot password
exports.forgotPassword = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    const error = new Error(
      "We could not find the use with the given email.",
      404
    );
    next(error);
  }

  if (!user.verified) {
    return res.status(400).json({
      status: "fail",
      message: "email is not verified yet.",
    });
  }
  //2
  const resetToken = user.createResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  //3
  const resetUrl = `${req.protocol}://localhost:5173/resetPassword/${resetToken}`;

  const message = `We have received a password reset request. 
Please use the link below to reset your password:
  
${resetUrl}
  
This reset password link will be valid only for 10 minutes.`;
  try {
    await sendEmail({
      email: user.email,
      subject: "Password change request recieved",
      text: message,
    });

    res.status(200).json({
      status: "succes",
      message: "paswword reset link send to the user email",
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    user.save({ validateBeforeSave: false });

    return next(
      new Error(
        "There was an error sending password reset email. Please try again later ",
        500
      )
    );
  }
};

//? reset password
exports.resetPassword = async (req, res, next) => {
  //if the user exists
  const token = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      status: "fail",
      message: "Token is invalid or has expired!",
    });
  }

  //resetting the user password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;
  user.passwordChangedAt = Date.now();

  user.save();

  const loginToken = signToken(user._id);

  const userForResponse = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  res.status(200).json({
    status: "success",
    user: userForResponse,
    loginToken,
  });
};

//?verify email
exports.verifyEmail = async (req, res) => {
  const token = req.params.token;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  try {
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        status: "fail",
        message: "Token is invalid or has expired",
      });
    }

    user.verified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: "success",
      message: "Email verified successfully!",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Error verifying email: " + err.message,
    });
  }
};

//? resending email
exports.resendVerificationEmail = async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "There is no user with this email address.",
      });
    }

    if (user.verified) {
      return res.status(400).json({
        status: "fail",
        message: "This email is already verified.",
      });
    }

    const currentHourStart = moment().startOf("hour");
    if (
      user.lastVerificationAttemptAt &&
      moment(user.lastVerificationAttemptAt).isSameOrAfter(currentHourStart)
    ) {
      return res.status(400).json({
        status: "fail",
        message:
          "You have exceeded the limit of resend attempts for this hour.",
      });
    }

    const verificationToken = user.createEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    const verifyUrl = `${req.protocol}://localhost:5173/verifyEmail/${verificationToken}`;

    const message = `You're receiving this email because you (or someone else) have requested the resend of the email verification link for your account.\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\n${verifyUrl}\n\nIf you did not request this, please ignore this email and your account will remain unverified.`;

    await sendEmail({
      email: user.email,
      subject: "Resend Email Verification Link",
      text: message,
    });

    user.lastVerificationAttemptAt = new Date();
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: "success",
      message: "Verification email has been resent. Please check your email.",
    });
  } catch (err) {
    console.error("Error during email resend: ", err);
    res.status(500).json({
      status: "error",
      message: "An error occurred while resending the verification email.",
    });
  }
};

// contact
exports.sendContactEmail = async (req, res) => {
  const { email, subject, message } = req.body;
  const textContent = `Message from: ${email}\n\nMessage:\n${message}`;

  try {
    await sendEmail({
      email: "manageprojectseffectively@gmail.com",
      subject: subject,
      text: textContent,
    });
    res
      .status(200)
      .json({ status: "success", message: "Email sent successfully" });
  } catch (error) {
    console.error("Email sending error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to send email",
      error: error.message,
    });
  }
};

// newsletter
exports.subscribeToNewsletter = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ status: "fail", message: "Please register first." });
    }

    const subscriptionResult = await addToMailchimpList(email);

    if (subscriptionResult.alreadySubscribed) {
      return res.status(200).json({
        status: "info",
        message: "You already subscribed to the newsletter.",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Successfully subscribed to the newsletter!",
    });
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to subscribe to the newsletter.",
    });
  }
};
