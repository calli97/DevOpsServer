import { Router } from "express";
import { ConfigFileService } from "../service/ConfigFileService";
import { ConfigFileController } from "../controller/ConfigFileController";
import { validate } from "../middleware/validate";
import { createConfigFileSchema, updateConfigFileSchema } from "../schemas/config-file.schema";
import { idParamSchema } from "../schemas/deploy.schema";

const router = Router();

let controller: ConfigFileController;

async function getController() {
  if (!controller) {
    const configFileService = new ConfigFileService();
    controller = new ConfigFileController(configFileService);
  }
  return controller;
}

router.get("/", async (req, res) => (await getController()).listAll(req, res));
router.get("/:id", validate(idParamSchema, "params"), async (req, res) => (await getController()).getById(req, res));
router.post("/", validate(createConfigFileSchema), async (req, res) => (await getController()).create(req, res));
router.put("/:id", validate(idParamSchema, "params"), validate(updateConfigFileSchema), async (req, res) => (await getController()).update(req, res));
router.delete("/:id", validate(idParamSchema, "params"), async (req, res) => (await getController()).delete(req, res));

export default router;
