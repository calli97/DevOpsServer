import dotenv from "dotenv";

dotenv.config();

export default {
  port: process.env.PORT,
  githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
};
