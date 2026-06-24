const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,   // Use Gmail App Password
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"FinBuddy" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent to ${to}`);
  } catch (error) {
    console.error('Email error:', error.message);
    throw error;
  }
};

// Email Templates
const emailTemplates = {
  verifyEmail: (name, verifyUrl) => ({
    subject: 'Verify your FinBuddy account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: #00d4ff; margin: 0;">💰 FinBuddy</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px;">
          <h2>Welcome, ${name}!</h2>
          <p>Please verify your email to start your financial journey.</p>
          <a href="${verifyUrl}" style="
            background: linear-gradient(135deg, #00d4ff, #0099cc);
            color: white;
            padding: 12px 30px;
            border-radius: 8px;
            text-decoration: none;
            display: inline-block;
            margin: 20px 0;
            font-weight: bold;
          ">Verify Email</a>
          <p style="color: #666; font-size: 12px;">Link expires in 24 hours.</p>
        </div>
      </div>
    `
  }),

  otpEmail: (name, otp) => ({
    subject: 'Your FinBuddy OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: #00d4ff; margin: 0;">💰 FinBuddy</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px;">
          <h2>Hello, ${name}!</h2>
          <p>Your OTP for FinBuddy login:</p>
          <div style="
            background: #1a1a2e;
            color: #00d4ff;
            font-size: 36px;
            font-weight: bold;
            text-align: center;
            padding: 20px;
            border-radius: 8px;
            letter-spacing: 8px;
            margin: 20px 0;
          ">${otp}</div>
          <p style="color: #666; font-size: 12px;">Valid for 10 minutes. Never share this OTP.</p>
        </div>
      </div>
    `
  }),

  welcomeEmail: (name) => ({
    subject: 'Welcome to FinBuddy! 🚀',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: #00d4ff; margin: 0;">💰 FinBuddy</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px;">
          <h2>Welcome aboard, ${name}! 🎉</h2>
          <p>You now have <strong>₹1,00,000 virtual money</strong> to start your investment journey.</p>
          <h3>What you can do:</h3>
          <ul>
            <li>📈 Trade stocks with virtual money</li>
            <li>💸 Split bills with friends</li>
            <li>🤖 Get AI financial advice</li>
            <li>🏆 Battle friends in trading competitions</li>
          </ul>
          <p>Your FinScore starts at <strong>500</strong>. Build it up!</p>
        </div>
      </div>
    `
  })
};

module.exports = { sendEmail, emailTemplates };