import inquirer from "inquirer";
import Deploy from "./entity/Deploy";

// Function to list all processes with their status
async function listProcesses() {
  const deploysWithStatus = await Deploy.listProcessesWithStatus();

  if (deploysWithStatus.length === 0) {
    console.log("\nNo processes found. Add a new process to get started.\n");
    return;
  }

  // Create choices for the menu
  const choices = [
    ...deploysWithStatus.map(({ deploy, isRunning }) => ({
      name: `${deploy.name} - [${isRunning ? "Running" : "Stopped"}]`,
      value: deploy.id,
    })),
    new inquirer.Separator(),
    { name: "Back to main menu", value: null },
  ];

  const answer = await inquirer.prompt([
    {
      type: "list",
      name: "processId",
      message: "Select a process to manage:",
      choices: choices,
    },
  ]);

  if (answer.processId === null) {
    return;
  }

  // Find the selected deploy
  const selected = deploysWithStatus.find(
    ({ deploy }) => deploy.id === answer.processId
  );

  if (selected) {
    await processMenu(selected.deploy, selected.isRunning);
    // Return to list after action
    await listProcesses();
  }
}

// Menu for individual process management
async function processMenu(deploy: Deploy, isRunning: boolean) {
  const choices = [];

  if (isRunning) {
    choices.push("Stop process");
  } else {
    choices.push("Start process");
  }

  choices.push(new inquirer.Separator(), "Back to process list");

  const answer = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: `Managing: ${deploy.name} [${isRunning ? "Running" : "Stopped"}]`,
      choices: choices,
    },
  ]);

  if (answer.action === "Back to process list") {
    return;
  }

  if (answer.action === "Start process") {
    console.log(`\nStarting ${deploy.name}...`);
    try {
      await deploy.storeStartCmd();
      // Sync status after starting
      await deploy.syncStatusWithPM2();
      console.log(`✓ ${deploy.name} started successfully\n`);
    } catch (error) {
      console.error(`✗ Failed to start ${deploy.name}: ${error.message}\n`);
    }
  } else if (answer.action === "Stop process") {
    console.log(`\nStopping ${deploy.name}...`);
    try {
      await deploy.stop();
      // Sync status after stopping
      await deploy.syncStatusWithPM2();
      console.log(`✓ ${deploy.name} stopped successfully\n`);
    } catch (error) {
      console.error(`✗ Failed to stop ${deploy.name}: ${error.message}\n`);
    }
  }
}

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
      console.log("Bye!");
      process.exit(0);

    case "List processes":
      await listProcesses();
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
