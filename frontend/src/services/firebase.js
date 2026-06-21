import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import dataService from './dataService';

// Your web app's Firebase configuration
// These values will be populated via Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKey-please-configure-env",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sccdp-demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sccdp-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sccdp-demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef"
};

// Initialize Firebase only if we are not in pure mock mode and keys are provided
let app;
let messaging;

try {
  app = initializeApp(firebaseConfig);
  messaging = getMessaging(app);
} catch (error) {
  console.warn('Firebase initialization failed. Push notifications will be disabled.', error);
}

export const requestNotificationPermission = async () => {
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      // Get the FCM registration token
      const currentToken = await getToken(messaging, { 
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || "YOUR_VAPID_KEY_HERE" 
      });
      
      if (currentToken) {
        console.log('FCM Token retrieved:', currentToken);
        // Send token to our backend to store it for the user
        await dataService.registerDeviceToken(currentToken);
        return currentToken;
      } else {
        console.log('No registration token available. Request permission to generate one.');
        return null;
      }
    } else {
      console.log('Unable to get permission to notify.');
      return null;
    }
  } catch (error) {
    console.error('An error occurred while retrieving token. ', error);
    return null;
  }
};

export const onMessageListener = (callback) => {
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};
