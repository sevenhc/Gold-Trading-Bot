const nodemailer = require("nodemailer");

let sendMail = (mailOptions)=>{
  let transporter = nodemailer.createTransport({
    host: "email-smtp.ap-southeast-1.amazonaws.com",
    port: 587,
    secure: false,
    auth: {
      user: EMAIL_API_USER,
      pass: EMAIL_API_SECRET,
    },
  });

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        return console.log(error);
    }
 
  });
};

module.exports = sendMail;
