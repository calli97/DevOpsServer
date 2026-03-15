import { DataSource, DataSourceOptions, EntityTarget } from "typeorm";
import config from "./config";
import Deploy from "./entity/Deploy";
import path from "path";

export const dataSource = new DataSource({
  ...config.database,
  entities: [
    path.join(__dirname, "entity/**/*.js"),
  ],
  synchronize: true,
} as DataSourceOptions);

export async function getRepository<T>(entity: EntityTarget<T>) {
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  return dataSource.getRepository(entity);
}
