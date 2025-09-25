import { DataSource, DataSourceOptions } from "typeorm";
import config from "./config";
import * as path from "path";

const dataSource = new DataSource({
  ...config.database,
  entities: [
    path.join(__dirname, "entity/**/*.ts"),
    path.join(__dirname, "entity/**/*.js"),
  ],
} as DataSourceOptions);

export const getRepository = dataSource.getRepository;
