const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendOTPEmail = async (to, otp, ngoName) => {
  const mailOptions = {
    from: `"FoodBridge Mumbai" <${process.env.EMAIL_USER}>`,
    to,
    subject: '🔐 Verify Your NGO - OTP Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 30px; background: #0D1117; color: #FCF9F1; border-radius: 16px;">
        <h2 style="color: #4ADE80; margin-bottom: 8px;">FoodBridge Mumbai</h2>
        <h3>NGO Verification OTP</h3>
        <p>Hello,</p>
        <p>We found <strong>${ngoName}</strong> in the official Mumbai 2025 NGO directory.</p>
        <p>Your One-Time Password is:</p>
        <div style="background: #161B22; border: 2px solid #4ADE80; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #4ADE80;">${otp}</span>
        </div>
        <p style="color: #9CA3AF;">This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <hr style="border-color: #21262D; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6B7280;">FoodBridge Mumbai — Connecting surplus food to those in need.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

exports.sendWelcomeEmail = async (to, name, role) => {
  const mailOptions = {
    from: `"FoodBridge Mumbai" <${process.env.EMAIL_USER}>`,
    to,
    subject: '🎉 Welcome to FoodBridge Mumbai!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 30px; background: #0D1117; color: #FCF9F1; border-radius: 16px;">
        <h2 style="color: #4ADE80;">Welcome, ${name}!</h2>
        <p>You've successfully registered as a <strong>${role}</strong> on FoodBridge Mumbai.</p>
        <p>Together, let's ensure no food goes to waste in Mumbai. 🍱</p>
        <p style="font-size: 12px; color: #6B7280; margin-top: 30px;">FoodBridge Mumbai</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};