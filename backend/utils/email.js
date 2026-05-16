const nodemailer = require('nodemailer');
const config = require('../config');

// Transporter is created once at module load — not on every email send
let transporterPromise = null;

const getTransporter = () => {
  if (!transporterPromise) {
    if (config.env === 'production' && config.smtp.host) {
      // Use configured SMTP in production
      transporterPromise = Promise.resolve(
        nodemailer.createTransport({
          host: config.smtp.host,
          port: config.smtp.port,
          auth: { user: config.smtp.user, pass: config.smtp.pass },
        })
      );
    } else {
      // Use Ethereal test account in development — created only once
      transporterPromise = nodemailer.createTestAccount().then((account) =>
        nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: { user: account.user, pass: account.pass },
        })
      );
    }
  }
  return transporterPromise;
};

const sendEmail = async (to, subject, text) => {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: '"ProFlow Tasks" <no-reply@proflow.com>',
      to,
      subject,
      text,
    });
    if (config.env !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Email error:', error);
  }
};

module.exports = sendEmail;
