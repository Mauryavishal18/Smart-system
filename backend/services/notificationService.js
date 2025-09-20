import twilio from 'twilio';
import axios from 'axios';

const twilioClient = process.env.TWILIO_ACCOUNT_SID 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

export const sendEmergencyNotifications = async (emergency, responders) => {
  try {
    const notifications = [];

    // Send SMS to responders
    for (const responder of responders) {
      try {
        await sendSMS(
          responder.phone,
          `EMERGENCY ALERT: ${emergency.type} at ${emergency.location.address || 'Unknown location'}. 
          Open emergency app to respond. ID: ${emergency._id}`
        );

        // Send push notification
        await sendPushNotification(
          responder.deviceTokens,
          'Emergency Alert',
          `${emergency.type} nearby. Tap to respond.`,
          { emergencyId: emergency._id }
        );

        notifications.push({
          responderId: responder._id,
          type: 'sms_push',
          status: 'sent'
        });
      } catch (error) {
        console.error(`Failed to notify responder ${responder._id}:`, error);
        notifications.push({
          responderId: responder._id,
          type: 'sms_push',
          status: 'failed',
          error: error.message
        });
      }
    }

    // Simulate government services notifications
    await notifyGovernmentServices(emergency);

    return notifications;
  } catch (error) {
    console.error('Error sending emergency notifications:', error);
    throw error;
  }
};

export const sendSMS = async (phoneNumber, message) => {
  try {
    if (twilioClient) {
      const result = await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });
      return result;
    } else {
      // Demo mode - log SMS instead of sending
      console.log(`[DEMO SMS] To: ${phoneNumber}, Message: ${message}`);
      return { sid: 'demo_' + Date.now() };
    }
  } catch (error) {
    console.error('SMS sending failed:', error);
    throw error;
  }
};

export const sendPushNotification = async (deviceTokens, title, body, data = {}) => {
  try {
    // In production, use Firebase Cloud Messaging
    // For demo, we'll simulate push notifications
    console.log(`[DEMO PUSH] Title: ${title}, Body: ${body}, Tokens: ${deviceTokens?.length || 0}`);
    
    return {
      success: true,
      tokensProcessed: deviceTokens?.length || 0
    };
  } catch (error) {
    console.error('Push notification failed:', error);
    throw error;
  }
};

const notifyGovernmentServices = async (emergency) => {
  try {
    // Simulate police notification
    console.log(`[DEMO POLICE] Emergency ${emergency._id} at ${emergency.location.address}`);
    
    // Simulate ambulance service (108)
    console.log(`[DEMO AMBULANCE] Emergency medical alert ${emergency._id}`);
    
    // Simulate hospital notification
    console.log(`[DEMO HOSPITAL] Incoming emergency patient ${emergency._id}`);
    
    return {
      police: 'notified',
      ambulance: 'notified',
      hospital: 'notified'
    };
  } catch (error) {
    console.error('Government services notification failed:', error);
    return {
      police: 'failed',
      ambulance: 'failed', 
      hospital: 'failed'
    };
  }
};