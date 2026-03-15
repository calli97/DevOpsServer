import express from "express";
import routes from "./routes";
import config from "./config";
import helmet from "helmet";
import { GitHubService } from "./service/GitHubService";
import cors from "cors";
import { logMiddleware } from "./middleware/logMiddleware";
import { apiKeyMiddleware } from "./middleware/apiKeyMiddleware";
import { logger } from "./service/LogService";

const app = express();

// Wireado de dependencias
const githubService = new GitHubService();

app.use(logMiddleware);
app.use(helmet());

app.use("/github/webhook", express.raw({ type: "*/*" }));
app.use(express.json());
app.use((req, res, next) => {
  const signature = req.headers["x-hub-signature"] as string;
  if (signature && req.path === "/github/webhook") {
    return githubService.verifyGithubSignture(signature, req.body as Buffer, next, res);
  }
  // Otherwise, apply CORS and API key validation
  cors()(req, res, () => {
    apiKeyMiddleware(req, res, next);
  });
});

app.use(express.urlencoded({ extended: true }));

app.use("/", routes);

app.listen(config.port, () => {
  logger.success(`Server running on port ${config.port}`);
});
