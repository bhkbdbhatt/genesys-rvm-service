const axios = require('axios');
const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * Triggers direct-to-voicemail drop via Telnyx Call Control API
 */
async function sendRinglessVoicemail({ phoneNumber, messageText, audioUrl, callerId }) {
    const formattedPhone = phoneNumber.replace(/[^\d+]/g, '');
    const fromNumber = callerId || config.defaultFromNumber;

    // Telnyx Direct-to-Voicemail URI routing parameter
    const payload = {
        to: `${formattedPhone};dv=true`,
        from: fromNumber,
        connection_id: config.telnyxConnectionId,
        audio_url: audioUrl || undefined,
        text: audioUrl ? undefined : messageText,
        voice: audioUrl ? undefined : 'female',
        language: audioUrl ? undefined : 'en-US'
    };

    try {
        const response = await axios.post('https://api.telnyx.com/v2/calls', payload, {
            headers: {
                'Authorization': `Bearer ${config.telnyxApiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        const callId = response.data?.data?.call_control_id || 'UNKNOWN';
        logger.info('Voicemail drop dispatched successfully', { callId, recipient: formattedPhone });

        return {
            status: 'SUCCESS',
            callId,
            recipient: formattedPhone,
            detail: 'Voicemail drop initiated successfully'
        };
    } catch (error) {
        const errData = error.response?.data?.errors?.[0] || {};
        const statusCode = error.response?.status || 500;

        let reason = 'PROVIDER_ERROR';
        if (statusCode === 422 || errData.code === '10001') {
            reason = 'INVALID_NUMBER';
        } else if (statusCode === 429) {
            reason = 'RATE_LIMITED';
        } else if (statusCode === 408) {
            reason = 'NO_ANSWER';
        }

        logger.error('Provider error during voicemail drop', { reason, statusCode, detail: errData.detail || error.message });

        return {
            status: 'FAILED',
            reason,
            statusCode,
            detail: errData.detail || error.message || 'Call delivery failed'
        };
    }
}

module.exports = { sendRinglessVoicemail };