import dotenv from "dotenv";

dotenv.config();

const env = {
  port: Number(process.env.PORT || 3000),
  fortniteApiUrl:
    process.env.FORTNITE_API_URL || "https://fortnite-api.com/v2/cosmetics?language=pt-BR",
  db: {
    host: process.env.POSTGRES_HOST || "localhost",
    port: Number(process.env.POSTGRES_PORT || 5432),
    database: process.env.POSTGRES_DB || "fortnite",
    user: process.env.POSTGRES_USER || "fortnite",
    password: process.env.POSTGRES_PASSWORD || "fortnite",
  },
};

export default env;
