import { Router } from "express";
import { DeployService } from "../service/DeployService";
import { DeployController } from "../controller/DeployController";
import { validate } from "../middleware";
import {
  createDeploySchema,
  updateDeploySchema,
  idParamSchema,
} from "../schemas/deploy.schema";

const router = Router();

// Wireado de dependencias
const deployService = new DeployService();
const deployController = new DeployController(deployService);

router.get("/", deployController.listAll);
router.get("/:id", validate(idParamSchema, "params"), deployController.getById);
router.post("/", validate(createDeploySchema), deployController.createDeploy);
router.put("/:id", validate(idParamSchema, "params"), validate(updateDeploySchema), deployController.updateDeploy);
router.delete("/:id", validate(idParamSchema, "params"), deployController.deleteDeploy);

export default router;
