import { Command } from "commander";
import PM2Service from "./service/PM2Service";
import { CLIOption } from "./utils/cli/types";
import { BodyField, Formatter } from "./utils/cli/formatter";

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
  .option("-a , --active <boolean>", "Define if a deploy is active")
  .option("--port <number>", "Port to expose")
  .option("--start <string>", "Running command")
  .option("--build <string>", "Build commands")
  .action((str: Array<CLIOption>, options) => {
    const fields: Array<BodyField> = [
      { name: "name", required: true, type: "string" },
      { name: "path", required: true, type: "string" },
      { name: "repository", required: true, type: "string" },
      { name: "branch", required: true, type: "string" },
      { name: "expose", required: false, type: "boolean" },
      { name: "active", required: false, type: "boolean" },
      { name: "port", required: false, type: "number" },
      { name: "start", required: true, type: "string" },
      { name: "build", required: true, type: "string" },
    ];
    console.log("STR: ", str);
    const { entity, errors } = Formatter.checkBodyFieldsAndReplace(
      {},
      str,
      fields
    );
    console.log("ENTITY", entity);
    console.log("ERRORS:", errors);
  });

program.parse();
