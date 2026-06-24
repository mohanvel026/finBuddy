const twilio = require('twilio');

let client;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
} else {
  console.warn('⚠️ Twilio SMS credentials missing. SMS notifications will be disabled (simulated in console).');
}

const sendSMS = async (to, message) => {
  try {
    if (!to || !message) return;

    if (!client) {
      console.log(`📱 [SMS Simulated] to ${to}: ${message}`);
      return;
    }

    // Format Indian number
    const formattedNumber = to.startsWith('+') ? to : `+91${to}`;

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedNumber,
    });

    console.log(`📱 SMS sent to ${formattedNumber}`);
  } catch (error) {
    console.error('SMS error:', error.message);
    // Don't throw — SMS is non-critical
  }
};

module.exports = { sendSMS };