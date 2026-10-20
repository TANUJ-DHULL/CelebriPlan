const handleRequest = require('../server.js');

module.exports = async (req, res) => {
    try {
        await handleRequest(req, res);
    } catch (err) {
        console.error('Vercel API Function Error:', err);
        if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Function execution error', message: err.message }));
        }
    }
};
