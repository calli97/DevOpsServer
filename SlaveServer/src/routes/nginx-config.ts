import { Router } from "express";
import { NginxConfigController } from "../controller/NginxConfigController";
import { NginxConfigService } from "../service/NginxConfigService";
import { validate } from "../middleware/validate";
import { nginxReadQuerySchema, nginxWriteBodySchema } from "../dto/slave.dto";

const router = Router();

let controller: NginxConfigController;
function getController() {
  if (!controller) controller = new NginxConfigController(new NginxConfigService());
  return controller;
}

router.get("/read", validate(nginxReadQuerySchema, "query"), (req, res) => getController().readFile(req, res));
router.post("/write", validate(nginxWriteBodySchema), (req, res) => getController().writeFile(req, res));

export default router;
