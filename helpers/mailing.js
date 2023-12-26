const nodemailer = require('nodemailer');


// ? node mailer
const sendVarifyMail = async (req, name, email) => {
  try {
    const otp = sendOtpVerification(4);
    req.session.otp = otp;
    console.log(req.session.otp);
    req.session.otpGeneratedTime = Date.now();
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: "neganishere73@gmail.com",
        pass: "rrhm xbbp yrnh cras",
      },
    });

    const mailOptions = {
      from: "neganishere73@gmail.com",
      to: email,
      subject: "For verification purpose",
      html: `<p>Hello ${name}, please enter this OTP: <strong>${otp}</strong> to verify your email.</p>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Email has been sent:", info.response);
      }
    });
  } catch (error) {
    console.log(error);
  }
};


// * send otp verification
// *otp senting
function sendOtpVerification(length) {
  const characters = "0123456789";
  let otp = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    otp += characters[randomIndex];
  }

  return otp;
}

// * mailoption for password change
const sendResetPassword = async (email, password) => {
  try {
    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: email,
      subject: 'your password',
      html: `<p>this is your <b> ${password} <b> password</p>`
    };

    await transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log('email has been sent', info.response);
      }
    });

    return true;
  } catch (error) {
    return false;
  }
};

module.exports = {
  sendVarifyMail,
  sendResetPassword
}