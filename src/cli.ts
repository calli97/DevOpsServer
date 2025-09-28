import { Command } from "commander";
import PM2Service from "./service/PM2Service";
import { CLIOption } from "./utils/cli/types";
import { BodyField, Formatter } from "./utils/cli/formatter";
import Deploy from "./entity/Deploy";
import "reflect-metadata";
import { dataSource } from "./dbConnection";

const program = new Command();

program
  .name("FreeDevOps CLI")
  .description("CLI to manage FreeDevOps deploys")
  .version("0.0.1");

program
  .command("ls")
  .description("List all process")
  .action(async (str, options) => {
    await PM2Service.listAll();
  });

program
  .command("add")
  .description("Add new process")
  .option("--name <string>", "Deploy instance name")
  .option("--path <string>", "Respostory path")
  .option("--repository <string>", "Github repository name")
  .option("--branch <string>", "Branch to deploy")
  .option("--expose <boolean>", "Define if port must be exposed")
  .option("--active <boolean>", "Define if a deploy is active")
  .option("--port <number>", "Port to expose")
  .option("--start <string>", "Running command")
  .option("--build <string>", "Build commands")
  .action(async (str: Array<CLIOption>, options) => {
    const fields: Array<BodyField> = [
      { name: "name", required: true, type: "string" },
      { name: "path", required: true, type: "string" },
      { name: "repository", required: true, type: "string" },
      { name: "branch", required: true, type: "string" },
      { name: "start", required: true, type: "string" },
      { name: "build", required: true, type: "string" },
      { name: "expose", required: false, type: "boolean" },
      { name: "active", required: false, type: "boolean" },
      { name: "port", required: false, type: "number" },
    ];
    const { entity, errors } = Formatter.checkBodyFieldsAndReplace(
      {},
      str,
      fields
    );
    if (errors.length > 0) {
      return console.log("ERRORS: ", errors);
    }

    const newDeploy = await Deploy.storeNewDeploy(
      entity.name,
      entity.path,
      entity.repository,
      entity.branch,
      entity.expose,
      entity.active,
      entity.build,
      entity.start,
      entity.port
    );

    console.log("ENTITY", entity);
    console.log("ERRORS:", errors);

    console.log("New deploy: ", newDeploy);
    await dataSource.destroy();
    process.exit(0);
  });

async function main() {
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
    console.log("📦 DataSource inicializado");
  }
  program.parse();
}

main();
