import winston from "winston";

const isProduction = process.env.NODE_ENV === "production";

const logger = winston.createLogger({
  level: isProduction ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    isProduction ? winston.format.json() : winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, ...rest }) => {
        const extra = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : "";
        return `${timestamp} ${level}: ${message}${extra}`;
      }),
    ),
  ),
  transports: [
    new winston.transports.Console(),
    ...(isProduction
      ? [
          new winston.transports.File({ filename: "logs/error.log", level: "error" }),
          new winston.transports.File({ filename: "logs/warn.log", level: "warn" }),
        ]
      : []),
  ],
});

export function stream() {
  return {
    write(message: string) {
      logger.http(message.trim());
    },
  };
}

export default logger;
