import express from "express";
import routes from "./routes";
import config from "./config";
import helmet from "helmet";
import { GitHubService } from "./service/GitHubService";
import cors from "cors";

const app = express();

// Wireado de dependencias
const githubService = new GitHubService();

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  // Check that exist a signature and validate with the secret
  const signature = req.headers["x-hub-signature"] as string;
  if (signature) {
    if (req.path == "/github/webhook") {
      return githubService.verifySignatureMiddleware(signature, req.body, next, res);
    }
  }
  // Otherwise, apply CORS
  cors()(req, res, next);
});

app.use("/", routes);

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
