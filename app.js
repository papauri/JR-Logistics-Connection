import fs from 'fs';

// Force the server to log errors to our new file
const logStream = fs.createWriteStream('./stderr.log', { flags: 'a' });
process.stderr.write = logStream.write.bind(logStream);
process.on('uncaughtException', (err) => {
    console.error('CRASH:', err);
});

// Start the server
import('./production_build/server.cjs').catch(err => {
    console.error("Startup Failed:", err);
});
