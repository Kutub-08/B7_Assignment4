import "dotenv/config";
import app from "./app.js";
import { prisma } from "./lib/prisma.js";
import logger from "./config/logger.js";

const PORT = Number(process.env.PORT) || 3000;

try {
  await prisma.$connect();
  logger.info("Database connected");
} catch (err) {
  logger.error("Failed to connect to database:", err);
  process.exit(1);
}

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
