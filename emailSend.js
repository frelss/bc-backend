const nodemailer = require("nodemailer");

const sendEmail = async (option) => {
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const emailOptions = {
    from: "Project Management Team <team@projectman.com>",
    to: option.email,
    subject: option.subject,
    text: option.text,
  };

  await transporter.sendMail(emailOptions);
};

module.exports = sendEmail;
