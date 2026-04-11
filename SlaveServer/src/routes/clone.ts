import { Router } from "express";
import { CloneController } from "../controller/CloneController";
import { GitService } from "../service/GitService";
import { validate } from "../middleware/validate";
import { cloneRequestSchema } from "../dto/slave.dto";

const router = Router();

const controller = new CloneController(new GitService());

router.post("/", validate(cloneRequestSchema), (req, res) => controller.clone(req, res));

export default router;
