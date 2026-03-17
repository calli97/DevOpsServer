import { Router } from "express";
import { ProjectInstanceService } from "../service/ProjectInstanceService";
import { ProjectInstanceController } from "../controller/ProjectInstanceController";
import { DeployService } from "../service/DeployService";
import { ConfigFileService } from "../service/ConfigFileService";
import { GitHubService } from "../service/GitHubService";
import PM2Service from "../service/PM2Service";
import { getRepository } from "../dbConnection";
import Deploy from "../entity/Deploy";
import { validate } from "../middleware/validate";
import { idParamSchema } from "../schemas/deploy.schema";
import {
  createProjectInstanceSchema,
  updateProjectInstanceSchema,
} from "../schemas/project-instance.schema";

const router = Router();

let controller: ProjectInstanceController;

async function getController() {
  if (!controller) {
    const deployRepository = await getRepository(Deploy);
    const pm2Service = new PM2Service();
    const githubService = new GitHubService();
    const configFileService = new ConfigFileService();
    const deployService = new DeployService(deployRepository, pm2Service, githubService);
    const projectInstanceService = new ProjectInstanceService(deployService, configFileService, githubService);
    controller = new ProjectInstanceController(projectInstanceService);
  }
  return controller;
}

router.get("/", async (req, res) => (await getController()).listAll(req, res));
router.get("/:id", validate(idParamSchema, "params"), async (req, res) => (await getController()).getById(req, res));
router.post("/", validate(createProjectInstanceSchema), async (req, res) => (await getController()).create(req, res));
router.put("/:id", validate(idParamSchema, "params"), validate(updateProjectInstanceSchema), async (req, res) => (await getController()).update(req, res));
router.delete("/:id", validate(idParamSchema, "params"), async (req, res) => (await getController()).delete(req, res));
router.post("/:id/start", validate(idParamSchema, "params"), async (req, res) => (await getController()).startDeploys(req, res));

export default router;
