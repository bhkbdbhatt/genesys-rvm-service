const { sendRinglessVoicemail } = require('../services/sipProvider.service');
const logger = require('../utils/logger');

/**
 * Normalizes incoming Avaya Orchestration / CTI Webhook payloads
 * and routes them to the core SIP provider service.
 */
async function handleAvayaWebhook(req, res) {
    try {
        const payload = req.body;
        logger.info('Received Avaya Webhook Payload', { rawPayload: payload });

        // Map Avaya field naming conventions (e.g., AXP Orchestrator or Breeze CTI variables)
        const phoneNumber = payload.DestinationAddress || payload.phoneNumber || payload.ani;
        const messageText = payload.PromptText || payload.messageText;
        const audioUrl = payload.MediaUrl || payload.audioUrl;
        const callerId = payload.OriginatingAddress || payload.callerId;
        const timestamp = payload.ScheduledTime || payload.timestamp;

        if (!phoneNumber) {
            return res.status(400).json({
                status: 'FAILED',
                reason: 'AVAYA_MAPPING_ERROR',
                detail: 'Could not extract valid phone number from Avaya payload key: DestinationAddress or phoneNumber'
            });
        }

        // Pass normalized fields to existing provider engine
        const result = await sendRinglessVoicemail({
            phoneNumber,
            messageText,
            audioUrl,
            callerId
        });

        if (result.status === 'SUCCESS') {
            return res.status(200).json({
                avayaResult: 'COMPLETED',
                providerResponse: result
            });
        } else {
            return res.status(502).json({
                avayaResult: 'FAILED',
                providerResponse: result
            });
        }
    } catch (err) {
        logger.error('Error processing Avaya event', { error: err.message });
        return res.status(500).json({
            avayaResult: 'ERROR',
            detail: err.message
        });
    }
}

module.exports = { handleAvayaWebhook };