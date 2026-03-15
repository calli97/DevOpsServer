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

app.use((req, res, next) => {
  // Check that exist a signature and validate with the secret
  const signature = req.headers["x-hub-signature"] as string;
  console.log("BODY: ", req);
  if (signature) {
    if (req.path == "/github/webhook") {
      return githubService.verifySignatureMiddleware(
        signature,
        req.body,
        next,
        res,
      );
    }
  }
  // Otherwise, apply CORS and API key validation
  cors()(req, res, () => {
    apiKeyMiddleware(req, res, next);
  });
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", routes);

app.listen(config.port, () => {
  logger.success(`Server running on port ${config.port}`);
});
