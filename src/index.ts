import express from "express";
import routes from "./routes";
import config from "./config";
import helmet from "helmet";

const app = express();

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", routes);

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
