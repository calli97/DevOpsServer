import dotenv from "dotenv";

dotenv.config();

export default {
  port: process.env.PORT,
  githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
  database: {
    type: process.env.DB_TYPE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
};
