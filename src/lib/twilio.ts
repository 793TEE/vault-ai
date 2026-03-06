import twilio from 'twilio';
import type { Workspace } from '@/types/database';

// Default Twilio client (for system-level operations)
const getDefaultClient = () => {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
};

// Workspace-specific Twilio client
const getWorkspaceClient = (workspace: Workspace) => {
  if (workspace.twilio_account_sid && workspace.twilio_auth_token) {
    return twilio(workspace.twilio_account_sid, workspace.twilio_auth_token);
  }
  return getDefaultClient();
};

// Get the phone number to send from
const getFromNumber = (workspace: Workspace): string => {
  return workspace.twilio_phone_number || process.env.TWILIO_PHONE_NUMBER!;
};

export interface SendSMSParams {
  workspace: Workspace;
  to: string;
  message: string;
}

export interface SendSMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendSMS(params: SendSMSParams): Promise<SendSMSResult> {
  const { workspace, to, message } = params;

  // Validate phone number format
  const cleanPhone = to.replace(/\D/g, '');
  if (cleanPhone.length < 10) {
    return { success: false, error: 'Invalid phone number' };
  }

  // Format phone number
  const formattedPhone = cleanPhone.length === 10 ? `+1${cleanPhone}` : `+${cleanPhone}`;

  try {
    const client = getWorkspaceClient(workspace);
    const fromNumber = getFromNumber(workspace);

    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: formattedPhone,
    });

    console.log(`SMS sent: ${result.sid} to ${formattedPhone}`);

    return {
      success: true,
      messageId: result.sid,
    };
  } catch (error: any) {
    console.error('Twilio SMS Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
    };
  }
}

export async function validatePhoneNumber(phone: string): Promise<{
  valid: boolean;
  formatted?: string;
  carrier?: string;
  type?: string;
}> {
  const cleanPhone = phone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.length === 10 ? `+1${cleanPhone}` : `+${cleanPhone}`;

  try {
    const client = getDefaultClient();
    const lookup = await client.lookups.v2.phoneNumbers(formattedPhone).fetch({
      fields: 'line_type_intelligence',
    });

    return {
      valid: lookup.valid,
      formatted: lookup.phoneNumber,
      carrier: lookup.lineTypeIntelligence?.carrierName,
      type: lookup.lineTypeIntelligence?.type,
    };
  } catch (error) {
    console.error('Phone validation error:', error);
    // Return basic validation if lookup fails
    return {
      valid: cleanPhone.length >= 10,
      formatted: formattedPhone,
    };
  }
}

export async function purchasePhoneNumber(areaCode?: string): Promise<{
  success: boolean;
  phoneNumber?: string;
  error?: string;
}> {
  try {
    const client = getDefaultClient();

    // Search for available numbers
    const availableNumbers = await client.availablePhoneNumbers('US').local.list({
      areaCode: areaCode ? parseInt(areaCode) : undefined,
      smsEnabled: true,
      voiceEnabled: true,
      limit: 1,
    });

    if (availableNumbers.length === 0) {
      return { success: false, error: 'No numbers available in that area' };
    }

    // Purchase the first available number
    const purchased = await client.incomingPhoneNumbers.create({
      phoneNumber: availableNumbers[0].phoneNumber,
      smsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/sms`,
      smsMethod: 'POST',
    });

    return {
      success: true,
      phoneNumber: purchased.phoneNumber,
    };
  } catch (error: any) {
    console.error('Phone purchase error:', error);
    return {
      success: false,
      error: error.message || 'Failed to purchase phone number',
    };
  }
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}
