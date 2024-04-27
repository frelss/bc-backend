const express = require("express");
const userController = require("../Controllers/userController");

const router = express.Router();

router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.post("/logout", userController.logout);
router.patch("/updatePassword", userController.updatePassword);
router.delete("/:userId", userController.deleteUser);
router.patch("/updateUserRole/:userId", userController.updateUserRole);
router.get("/getallusers", userController.getAllUsers);
router.post("/forgotPassword", userController.forgotPassword);
router.patch("/resetPassword/:token", userController.resetPassword);
router.get("/verifyEmail/:token", userController.verifyEmail);
router.post("/resendVerificationEmail", userController.resendVerificationEmail);
router.post("/send-contact-email", userController.sendContactEmail);
router.post("/subscribe", userController.subscribeToNewsletter);

module.exports = router;
