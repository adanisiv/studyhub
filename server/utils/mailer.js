const nodemailer = require('nodemailer');

// Only created if EMAIL_USER/EMAIL_PASS are set — lets the app run without an
// email account configured (falls back to devResetToken in authController).
const transporter = (process.env.EMAIL_USER && process.env.EMAIL_PASS)
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    })
  : null;

exports.isConfigured = () => !!transporter;

exports.sendResetEmail = async (toEmail, resetUrl) => {
  await transporter.sendMail({
    from: `StudyHub <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Reset your StudyHub password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">StudyHub</h2>
        <p>We received a request to reset your password. This link expires in 1 hour.</p>
        <p><a href="${resetUrl}" style="display:inline-block; background:#4f46e5; color:#fff; padding:10px 20px; border-radius:6px; text-decoration:none;">Reset Password</a></p>
        <p style="color:#666; font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `
  });
};
