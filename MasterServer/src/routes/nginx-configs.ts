import { Router } from "express";
import { NginxConfigService } from "../service/NginxConfigService";
import { NginxConfigController } from "../controller/NginxConfigController";
import { validate } from "../middleware/validate";
import { createNginxConfigSchema, updateNginxConfigSchema, forceSyncSchema, nginxTargetSchema } from "../schemas/nginx-config.schema";
import { idParamSchema } from "../schemas/deploy.schema";

const router = Router();

let controller: NginxConfigController;

async function getController() {
  if (!controller) {
    const nginxConfigService = new NginxConfigService();
    controller = new NginxConfigController(nginxConfigService);
  }
  return controller;
}

router.get("/by-instance/:instanceId", async (req, res) => (await getController()).listByInstance(req, res));
router.post("/", validate(createNginxConfigSchema), async (req, res) => (await getController()).create(req, res));
router.put("/:id", validate(idParamSchema, "params"), validate(updateNginxConfigSchema), async (req, res) => (await getController()).update(req, res));
router.delete("/:id", validate(idParamSchema, "params"), async (req, res) => (await getController()).delete(req, res));
router.post("/:id/run-commands", validate(idParamSchema, "params"), async (req, res) => (await getController()).runCommands(req, res));
router.post("/test-config", validate(nginxTargetSchema), async (req, res) => (await getController()).testConfig(req, res));
router.post("/reload", validate(nginxTargetSchema), async (req, res) => (await getController()).reload(req, res));
router.get("/:id/sync-status", validate(idParamSchema, "params"), async (req, res) => (await getController()).syncStatus(req, res));
router.post("/:id/force-sync", validate(idParamSchema, "params"), validate(forceSyncSchema), async (req, res) => (await getController()).forceSync(req, res));

export default router;
