const logger = {
    info: (msg, data = {}) => {
        console.log(JSON.stringify({ level: 'INFO', timestamp: new Date().toISOString(), message: msg, ...data }));
    },
    error: (msg, data = {}) => {
        console.error(JSON.stringify({ level: 'ERROR', timestamp: new Date().toISOString(), message: msg, ...data }));
    }
};

module.exports = logger;