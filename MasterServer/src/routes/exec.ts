import { Router } from "express";
import { ExecController } from "../controller/ExecController";
import { SlaveServerService } from "../service/SlaveServerService";
import { validate } from "../middleware/validate";
import { execSchema } from "../schemas/exec.schema";

const router = Router();

let controller: ExecController;

async function getController() {
  if (!controller) {
    controller = new ExecController(new SlaveServerService());
  }
  return controller;
}

router.post("/", validate(execSchema), async (req, res) => (await getController()).exec(req, res));

export default router;
