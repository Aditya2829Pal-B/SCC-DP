/**
 * Enterprise Notification Service
 * Integrates Firebase Push, Twilio SMS, and Nodemailer for Multi-Channel Alerts.
 * Supports Disaster Warnings, SLA Escalations, and Status Changes.
 */

import admin from 'firebase-admin';
import twilio from 'twilio';
import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';
import config from '../config/index.js';

class EnterpriseNotificationService {
  constructor() {
    this.isMockMode = config.nodeEnv !== 'production';

    // ── Initialize Firebase Admin ──
    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
        const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('ascii'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        this.firebaseInitialized = true;
      } else {
        this.firebaseInitialized = false;
        logger.warn('Firebase Service Account not provided, Push Notifications will be mocked.');
      }
    } catch (err) {
      logger.error('Failed to initialize Firebase Admin', { error: err.message });
      this.firebaseInitialized = false;
    }

    // ── Initialize Twilio ──
    try {
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        this.twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        this.twilioPhone = process.env.TWILIO_PHONE_NUMBER;
      } else {
        this.twilioClient = null;
        logger.warn('Twilio credentials not provided, SMS will be mocked.');
      }
    } catch (err) {
      logger.error('Failed to initialize Twilio', { error: err.message });
      this.twilioClient = null;
    }

    // ── Initialize Nodemailer ──
    try {
      if (process.env.SMTP_HOST) {
        this.emailTransporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
      } else {
        this.emailTransporter = null;
        logger.warn('SMTP credentials not provided, Emails will be mocked.');
      }
    } catch (err) {
      logger.error('Failed to initialize Nodemailer', { error: err.message });
      this.emailTransporter = null;
    }
  }

  /**
   * Send an Emergency Disaster Warning across all available channels.
   */
  async broadcastDisasterWarning(title, message, targetUsers) {
    logger.info('Broadcasting Disaster Warning', { title, userCount: targetUsers.length });

    const promises = [];

    // Push Notifications
    if (this.firebaseInitialized) {
      const tokens = targetUsers.map(u => u.fcmToken).filter(Boolean);
      if (tokens.length > 0) {
        promises.push(this._sendPush(tokens, title, message, { priority: 'high', type: 'disaster' }));
      }
    }

    // SMS
    if (this.twilioClient) {
      const phones = targetUsers.map(u => u.phone).filter(Boolean);
      for (const phone of phones) {
        promises.push(this._sendSMS(phone, `[EMERGENCY] ${title}: ${message}`));
      }
    }

    // Email
    if (this.emailTransporter) {
      const emails = targetUsers.map(u => u.email).filter(Boolean);
      if (emails.length > 0) {
        promises.push(this._sendEmail(emails, `EMERGENCY ALERT: ${title}`, message));
      }
    }

    if (promises.length > 0) {
      await Promise.allSettled(promises);
    } else {
      logger.info('[MOCK] Broadcast Disaster Warning Executed');
    }
  }

  /**
   * Notify user of complaint status change
   */
  async notifyStatusChange(user, complaint) {
    const title = `Complaint Status Update`;
    const message = `Your complaint "${complaint.title}" is now marked as ${complaint.status}.`;
    
    if (this.firebaseInitialized && user.fcmToken) {
      await this._sendPush([user.fcmToken], title, message, { complaintId: complaint._id.toString() });
    }
    if (this.emailTransporter && user.email) {
      await this._sendEmail([user.email], title, message);
    }
    
    logger.info('Status change notification sent', { userId: user._id, complaintId: complaint._id });
  }

  /**
   * Notify department admin of SLA Escalation
   */
  async notifySLAEscalation(adminUser, complaint) {
    const title = `SLA Escalation Alert`;
    const message = `Complaint "${complaint.title}" has breached SLA and requires immediate attention.`;
    
    if (this.emailTransporter && adminUser.email) {
      await this._sendEmail([adminUser.email], title, message);
    }
    logger.warn('SLA Escalation Alert dispatched', { adminId: adminUser._id, complaintId: complaint._id });
  }

  // ── Internal Senders ──

  async _sendPush(tokens, title, body, data = {}) {
    try {
      const message = {
        notification: { title, body },
        data,
        tokens
      };
      const response = await admin.messaging().sendMulticast(message);
      logger.info('Push notifications sent', { successCount: response.successCount });
    } catch (err) {
      logger.error('FCM Send Error', { error: err.message });
    }
  }

  async _sendSMS(to, body) {
    try {
      await this.twilioClient.messages.create({
        body,
        from: this.twilioPhone,
        to
      });
      logger.info('SMS sent successfully', { to });
    } catch (err) {
      logger.error('Twilio Send Error', { error: err.message, to });
    }
  }

  async _sendEmail(bccList, subject, text) {
    try {
      await this.emailTransporter.sendMail({
        from: `"SCC&DP System" <${process.env.SMTP_USER}>`,
        bcc: bccList,
        subject,
        text
      });
      logger.info('Email sent successfully', { recipientCount: bccList.length });
    } catch (err) {
      logger.error('SMTP Send Error', { error: err.message });
    }
  }
}

export default new EnterpriseNotificationService();
