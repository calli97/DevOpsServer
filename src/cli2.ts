import inquirer from "inquirer";
import Deploy from "./entity/Deploy";

const mainMenu = async () => {
  const answer = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "Welcome to FreeDevOps CLI. What do you wanna do?",
      choices: ["List processes", "Add new process", "Exit"],
    },
  ]);

  switch (answer.action) {
    case "Exit":
      console.log("👋 Bye!");
      process.exit(0);

    case "List processes":
      console.log("Here the list");
      break;
    case "Add new process":
      await addMenu();
      break;
  }
  await mainMenu();
};

async function addMenu() {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "name",
      message: "Enter a name for the new process",
    },
    {
      type: "input",
      name: "repository",
      message: "Enter the github repository name",
    },
    {
      type: "input",
      name: "path",
      message: "Enter the path where you want to store the repository",
    },
    {
      type: "input",
      name: "branch",
      message: "Enter the branch name",
    },
    {
      type: "input",
      name: "start",
      message: "Command to start the proyect",
    },
  ]);
  let buildResponses = [];
  let buildContinue = true;
  while (buildContinue) {
    let buildResponse = await inquirer.prompt([
      {
        type: "list",
        name: "continue",
        message: "Add command to build proyect or to run before start",
        choices: ["Yes", "No"],
      },
    ]);
    if (buildResponse.continue == "Yes") {
      let buildCommand = await inquirer.prompt([
        {
          type: "input",
          name: "buildcmd",
          message: "Enter command",
        },
      ]);
      buildResponses.push(buildCommand);
    } else {
      break;
    }
  }
  const startResponse = await inquirer.prompt([
    {
      type: "list",
      name: "active",
      message: "Start process?",
      choices: ["Yes", "No"],
    },
  ]);

  console.log("ANSWER GEN:", answers);
  console.log("BUILD RESPONSE: ", buildResponses);
  console.log("START: ", startResponse);

  const newDeploy = await Deploy.storeNewDeploy(
    answers.name,
    answers.path,
    answers.repository,
    answers.branch,
    false,
    startResponse.active,
    JSON.stringify(buildResponses.map((a) => a.buildcmd)),
    answers.start,
    0
  );
  if (startResponse.active == "No") {
    await newDeploy.stop();
  }

  return;
}

mainMenu();
