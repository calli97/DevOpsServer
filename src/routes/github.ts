import { Router } from "express";
import { GitHubWebhookController } from "../controller/GitHubWebhookController";
import { ProjectService } from "../service/ProjectService";
import { DeployService } from "../service/DeployService";
import { ConfigFileService } from "../service/ConfigFileService";
import { GitHubService } from "../service/GitHubService";
import PM2Service from "../service/PM2Service";
import { getRepository } from "../dbConnection";
import Project from "../entity/Project";
import Deploy from "../entity/Deploy";

const router = Router();

let controller: GitHubWebhookController;

async function getController() {
  if (!controller) {
    const projectRepository = await getRepository(Project);
    const deployRepository = await getRepository(Deploy);
    const pm2Service = new PM2Service();
    const deployService = new DeployService(deployRepository, pm2Service);
    const configFileService = new ConfigFileService();
    const githubService = new GitHubService();
    const projectService = new ProjectService(projectRepository, deployService, configFileService, githubService);
    controller = new GitHubWebhookController(projectService);
  }
  return controller;
}

router.post("/webhook", async (req, res) => (await getController()).receiveWebhook(req, res));

export default router;
