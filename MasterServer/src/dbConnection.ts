import { DataSource, DataSourceOptions, EntityTarget } from "typeorm";
import config from "./config";
import ConfigFile from "./entity/ConfigFile";
import Deploy from "./entity/Deploy";
import NginxConfig from "./entity/NginxConfig";
import Project from "./entity/Project";
import ProjectInstance from "./entity/ProjectInstance";
import SlaveServer from "./entity/SlaveServer";

export const dataSource = new DataSource({
  ...config.database,
  entities: [ConfigFile, Deploy, NginxConfig, Project, ProjectInstance, SlaveServer],
  synchronize: true,
} as DataSourceOptions);

export async function getRepository<T>(entity: EntityTarget<T>) {
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  return dataSource.getRepository(entity);
}
