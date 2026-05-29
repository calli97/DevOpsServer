import { Router } from "express";
import { DeployController } from "../controller/DeployController";
import { GitService } from "../service/GitService";
import { ConfigFileService } from "../service/ConfigFileService";
import { NginxConfigService } from "../service/NginxConfigService";
import { DeployService } from "../service/DeployService";
import PM2Service from "../service/PM2Service";
import { validate } from "../middleware/validate";
import { deployRequestSchema, stopRequestSchema } from "../dto/slave.dto";

const router = Router();

const pm2Service = new PM2Service();
const controller = new DeployController(
  new GitService(),
  new ConfigFileService(),
  new NginxConfigService(),
  new DeployService(pm2Service),
);

router.post("/stop", validate(stopRequestSchema), (req, res) =>
  controller.stopDeploy(req, res),
);

router.post("/", validate(deployRequestSchema), (req, res) =>
  controller.startOrRestartDeploys(req, res),
);

export default router;
