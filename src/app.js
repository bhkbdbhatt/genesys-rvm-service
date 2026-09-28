const express = require('express');
const config = require('./config/env');
const { handleVoicemailDrop } = require('./controllers/voicemail.controller');
const logger = require('./utils/logger');

const app = express();
app.use(express.json());

// Bearer Token Middleware for Genesys Data Action Authentication
app.use((req, res, next) => {
    if (req.path === '/health') return next();

    const authHeader = req.headers.authorization;
    if (config.authToken && (!authHeader || authHeader !== `Bearer ${config.authToken}`)) {
        return res.status(401).json({ status: 'FAILED', reason: 'UNAUTHORIZED', detail: 'Invalid or missing Bearer token' });
    }
    next();
});

// Routes
app.post('/api/v1/voicemail-drop', handleVoicemailDrop);
app.get('/health', (req, res) => res.status(200).send('OK'));

app.listen(config.port, () => {
    logger.info(`Ringless Voicemail service operational on port ${config.port}`);
});