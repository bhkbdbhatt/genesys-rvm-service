const { sendRinglessVoicemail } = require('../services/sipProvider.service');
const logger = require('../utils/logger');

async function handleVoicemailDrop(req, res) {
    const { phoneNumber, messageText, audioUrl, timestamp, callerId } = req.body;

    // 1. Validation
    if (!phoneNumber) {
        return res.status(400).json({
            status: 'FAILED',
            reason: 'INVALID_NUMBER',
            detail: 'phoneNumber parameter is required'
        });
    }

    if (!messageText && !audioUrl) {
        return res.status(400).json({
            status: 'FAILED',
            reason: 'INVALID_PAYLOAD',
            detail: 'Either messageText or audioUrl must be provided'
        });
    }

    // 2. Schedule Handling
    if (timestamp) {
        const scheduledDate = new Date(timestamp);
        const now = new Date();

        if (isNaN(scheduledDate.getTime())) {
            return res.status(400).json({
                status: 'FAILED',
                reason: 'INVALID_TIMESTAMP',
                detail: 'Invalid ISO 8601 timestamp'
            });
        }

        if (scheduledDate > now) {
            const delayMs = scheduledDate.getTime() - now.getTime();

            logger.info('Scheduling voicemail drop', { recipient: phoneNumber, scheduledFor: scheduledDate.toISOString() });

            setTimeout(async () => {
                await sendRinglessVoicemail({ phoneNumber, messageText, audioUrl, callerId });
            }, delayMs);

            return res.status(202).json({
                status: 'SCHEDULED',
                scheduledFor: scheduledDate.toISOString(),
                recipient: phoneNumber,
                detail: 'Voicemail drop queued for future delivery'
            });
        }
    }

    // 3. Immediate Delivery
    const result = await sendRinglessVoicemail({ phoneNumber, messageText, audioUrl, callerId });

    if (result.status === 'SUCCESS') {
        return res.status(200).json(result);
    } else {
        const httpStatus = result.reason === 'INVALID_NUMBER' ? 400 : 502;
        return res.status(httpStatus).json(result);
    }
}

module.exports = { handleVoicemailDrop };