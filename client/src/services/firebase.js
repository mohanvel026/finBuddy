// client/src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import api from './api';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app, messaging;

const initFirebase = () => {
  try {
    if (!firebaseConfig.apiKey) return null;
    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    return messaging;
  } catch (err) {
    console.log('Firebase not configured:', err.message);
    return null;
  }
};

export const requestNotificationPermission = async () => {
  try {
    const m = initFirebase();
    if (!m) return null;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const token = await getToken(m, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
    });

    if (token) {
      // Save token to backend
      await api.put('/users/fcm-token', { fcmToken: token });
      console.log('✅ FCM token registered');
    }
    return token;
  } catch (err) {
    console.log('Push notification setup failed:', err.message);
    return null;
  }
};

export const onForegroundMessage = (callback) => {
  try {
    const m = initFirebase();
    if (!m) return () => { };
    return onMessage(m, (payload) => {
      callback(payload);
    });
  } catch { return () => { }; }
};

export default { requestNotificationPermission, onForegroundMessage };