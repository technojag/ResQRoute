const logger = require('../utils/logger');

let firebaseAdmin = null;
let firebaseAvailable = false;

const initializeFirebase = () => {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!projectId || projectId === 'dummy' || !privateKey || privateKey === 'dummy') {
      logger.warn('⚠️  Firebase not configured — push notifications disabled');
      return null;
    }

    const admin = require('firebase-admin');
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert({
        type: 'service_account',
        project_id: projectId,
        private_key: privateKey.replace(/\\n/g, '\n'),
        client_email: clientEmail
      })
    });
    firebaseAvailable = true;
    logger.info('✅ Firebase initialised');
    return firebaseAdmin;
  } catch (error) {
    logger.warn('⚠️  Firebase init failed: ' + error.message);
    return null;
  }
};

const sendPushNotification = async (token, notification, data = {}) => {
  if (!firebaseAvailable) return { success: false, reason: 'Firebase not configured' };
  try {
    const admin = require('firebase-admin');
    const response = await admin.messaging().send({ token, notification, data });
    return { success: true, messageId: response };
  } catch (error) {
    logger.error('Push notification error:', error.message);
    return { success: false, error: error.message };
  }
};

const sendMulticastNotification = async (tokens, notification, data = {}) => {
  if (!firebaseAvailable || !tokens || tokens.length === 0) {
    return { success: false, reason: 'Firebase not configured or no tokens' };
  }
  try {
    const admin = require('firebase-admin');
    const response = await admin.messaging().sendMulticast({ tokens, notification, data });
    return { success: true, successCount: response.successCount, failureCount: response.failureCount };
  } catch (error) {
    logger.error('Multicast notification error:', error.message);
    return { success: false, error: error.message };
  }
};

const sendTopicNotification = async (topic, notification, data = {}) => {
  if (!firebaseAvailable) return { success: false, reason: 'Firebase not configured' };
  try {
    const admin = require('firebase-admin');
    const response = await admin.messaging().send({ topic, notification, data });
    return { success: true, messageId: response };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const subscribeToTopic = async (tokens, topic) => {
  if (!firebaseAvailable) return { success: false };
  try {
    const admin = require('firebase-admin');
    const response = await admin.messaging().subscribeToTopic(tokens, topic);
    return { success: true, count: response.successCount };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const unsubscribeFromTopic = async (tokens, topic) => {
  if (!firebaseAvailable) return { success: false };
  try {
    const admin = require('firebase-admin');
    const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
    return { success: true, count: response.successCount };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = {
  initializeFirebase,
  sendPushNotification,
  sendMulticastNotification,
  sendTopicNotification,
  subscribeToTopic,
  unsubscribeFromTopic
};