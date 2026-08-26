const fs = require('fs');
const { createLogger, format, transports } = require('winston');

if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
}

const isDev = process.env.NODE_ENV === 'development';

const logger = createLogger({
    level: isDev ? 'debug' : 'info',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.splat(),
        format.json()
    ),
    transports: [
        new transports.Console({
            format: isDev
                ? format.combine(
                    format.colorize(),
                    format.printf(({ timestamp, level, message }) => {
                        return `${timestamp} [${level}]: ${message}`;
                    })
                )
                : format.json()
        }),
        new transports.File({ filename: 'logs/error.log', level: 'error' }),
        new transports.File({ filename: 'logs/combined.log' })
    ],
    exceptionHandlers: [
        new transports.File({ filename: 'logs/exceptions.log' })
    ]
});

module.exports = logger;