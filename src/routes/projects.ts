import { Router } from "express";
import { ProjectService } from "../service/ProjectService";
import { DeployService } from "../service/DeployService";
import { ConfigFileService } from "../service/ConfigFileService";
import { GitHubService } from "../service/GitHubService";
import PM2Service from "../service/PM2Service";
import { ProjectController } from "../controller/ProjectController";
import { getRepository } from "../dbConnection";
import Project from "../entity/Project";
import Deploy from "../entity/Deploy";

const router = Router();

let controller: ProjectController;

async function getController() {
  if (!controller) {
    const projectRepository = await getRepository(Project);
    const deployRepository = await getRepository(Deploy);
    const pm2Service = new PM2Service();
    const deployService = new DeployService(deployRepository, pm2Service);
    const configFileService = new ConfigFileService();
    const githubService = new GitHubService();
    const projectService = new ProjectService(projectRepository, deployService, configFileService, githubService);
    controller = new ProjectController(projectService);
  }
  return controller;
}

router.get("/", async (req, res) => (await getController()).listAll(req, res));
router.get("/:id", async (req, res) => (await getController()).getById(req, res));
router.post("/", async (req, res) => (await getController()).create(req, res));
router.put("/:id", async (req, res) => (await getController()).update(req, res));
router.delete("/:id", async (req, res) => (await getController()).delete(req, res));
router.post("/:id/start", async (req, res) => (await getController()).startDeploys(req, res));
router.post("/:id/restart", async (req, res) => (await getController()).restartDeploys(req, res));

export default router;
