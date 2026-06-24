// server/utils/pushNotification.js
/**
 * Firebase Cloud Messaging Push Notification Engine
 * Sends alerts to registered user devices.
 */

const sendPushNotification = async ({ fcmToken, title, body, data = {} }) => {
  try {
    console.log(`📡 [FCM PUSH] Sending notification to device:`);
    console.log(`   Token: ${fcmToken}`);
    console.log(`   Title: ${title}`);
    console.log(`   Body : ${body}`);
    console.log(`   Data :`, data);

    // In a real-world environment, we would initialize firebase-admin and call:
    // admin.messaging().send({ token: fcmToken, notification: { title, body }, data })
    
    return { success: true, messageId: 'simulated_msg_' + Math.random().toString(36).substring(7) };
  } catch (err) {
    console.error('FCM Push notification error:', err.message);
    throw err;
  }
};

const sendPush = async (token, title, body) => {
  return sendPushNotification({ fcmToken: token, title, body });
};

module.exports = { sendPushNotification, sendPush };
