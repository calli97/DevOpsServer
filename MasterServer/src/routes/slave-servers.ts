import { Router } from "express";
import { SlaveServerService } from "../service/SlaveServerService";
import { SlaveServerController } from "../controller/SlaveServerController";
import { validate } from "../middleware/validate";
import { createSlaveServerSchema, updateSlaveServerSchema } from "../schemas/slave-server.schema";
import { idParamSchema } from "../schemas/deploy.schema";

const router = Router();

let controller: SlaveServerController;

async function getController() {
  if (!controller) {
    const slaveServerService = new SlaveServerService();
    controller = new SlaveServerController(slaveServerService);
  }
  return controller;
}

router.get("/", async (req, res) => (await getController()).listAll(req, res));
router.get("/:id", validate(idParamSchema, "params"), async (req, res) => (await getController()).getById(req, res));
router.post("/", validate(createSlaveServerSchema), async (req, res) => (await getController()).create(req, res));
router.put("/:id", validate(idParamSchema, "params"), validate(updateSlaveServerSchema), async (req, res) => (await getController()).update(req, res));
router.delete("/:id", validate(idParamSchema, "params"), async (req, res) => (await getController()).delete(req, res));

export default router;
