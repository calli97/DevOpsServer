import { Router } from "express";
import { NginxConfigService } from "../service/NginxConfigService";
import { NginxConfigController } from "../controller/NginxConfigController";
import { validate } from "../middleware/validate";
import { createNginxConfigSchema, updateNginxConfigSchema } from "../schemas/nginx-config.schema";
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

export default router;
