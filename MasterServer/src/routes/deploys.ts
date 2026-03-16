import { Router } from "express";
import { DeployService } from "../service/DeployService";
import { GitHubService } from "../service/GitHubService";
import PM2Service from "../service/PM2Service";
import { DeployController } from "../controller/DeployController";
import { getRepository } from "../dbConnection";
import Deploy from "../entity/Deploy";
import { validate } from "../middleware/validate";
import { createDeployDirectSchema, updateDeployDirectSchema } from "../schemas/deploy-direct.schema";
import { idParamSchema } from "../schemas/deploy.schema";

const router = Router();

let controller: DeployController;

async function getController() {
  if (!controller) {
    const deployRepository = await getRepository(Deploy);
    const pm2Service = new PM2Service();
    const githubService = new GitHubService();
    const deployService = new DeployService(deployRepository, pm2Service, githubService);
    controller = new DeployController(deployService);
  }
  return controller;
}

router.get("/", async (req, res) => (await getController()).listAll(req, res));
router.get("/:id", validate(idParamSchema, "params"), async (req, res) => (await getController()).getById(req, res));
router.post("/", validate(createDeployDirectSchema), async (req, res) => (await getController()).create(req, res));
router.put("/:id", validate(idParamSchema, "params"), validate(updateDeployDirectSchema), async (req, res) => (await getController()).update(req, res));
router.delete("/:id", validate(idParamSchema, "params"), async (req, res) => (await getController()).delete(req, res));
router.post("/:id/start", validate(idParamSchema, "params"), async (req, res) => (await getController()).startDeploy(req, res));
router.post("/:id/stop", validate(idParamSchema, "params"), async (req, res) => (await getController()).stopDeploy(req, res));

export default router;
