import { Router } from "express";
import { ExecController } from "../controller/ExecController";
import { ExecService } from "../service/ExecService";
import { validate } from "../middleware/validate";
import { execRequestSchema } from "../dto/slave.dto";

const router = Router();

const controller = new ExecController(new ExecService());

router.post("/", validate(execRequestSchema), (req, res) => controller.exec(req, res));

export default router;
