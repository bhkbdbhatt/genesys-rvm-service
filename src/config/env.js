require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    telnyxApiKey: process.env.TELNYX_API_KEY,
    telnyxConnectionId: process.env.TELNYX_CONNECTION_ID,
    defaultFromNumber: process.env.DEFAULT_FROM_NUMBER,
    authToken: process.env.AUTH_TOKEN
};