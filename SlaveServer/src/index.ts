import express from "express";
import helmet from "helmet";
import cors from "cors";
import config from "./config";
import routes from "./routes/index";
import { logMiddleware } from "./middleware/logMiddleware";
import { apiKeyMiddleware } from "./middleware/apiKeyMiddleware";
import { logger } from "./service/LogService";

const app = express();

app.use(logMiddleware);
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(apiKeyMiddleware);
app.use("/", routes);

app.listen(config.port, () => {
  logger.success(`SlaveServer running on port ${config.port}`);
});
