import dotenv from "dotenv";

dotenv.config();

const env = {
  port: Number(process.env.PORT || 3000),
  fortniteApiUrl:
    process.env.FORTNITE_API_URL || "https://fortnite-api.com/v2/cosmetics?language=pt-BR",
  fortniteApiNewUrl:
    process.env.FORTNITE_API_NEW_URL ||
    "https://fortnite-api.com/v2/cosmetics/new?language=pt-BR",
  fortniteShopUrl:
    process.env.FORTNITE_API_SHOP_URL || "https://fortnite-api.com/v2/shop?language=pt-BR",
  jwt: {
    secret: process.env.JWT_SECRET || "dev-secret-change-me",
    expiresIn: process.env.JWT_EXPIRES_IN || "12h",
  },
  db: {
    host: process.env.POSTGRES_HOST || "localhost",
    port: Number(process.env.POSTGRES_PORT || 5432),
    database: process.env.POSTGRES_DB || "fortnite",
    user: process.env.POSTGRES_USER || "fortnite",
    password: process.env.POSTGRES_PASSWORD || "fortnite",
  },
  cors: {
    allowedOrigins: (process.env.CORS_ALLOWED_ORIGINS || "*")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  },
  syncCronSchedule: process.env.SYNC_CRON_SCHEDULE || "0 3 * * *",
  syncCronTimezone: process.env.SYNC_CRON_TZ || "America/Sao_Paulo",
};

export default env;