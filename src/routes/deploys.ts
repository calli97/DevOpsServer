import { Router } from "express";
import { DeployService } from "../service/DeployService";
import { DeployController } from "../controller/DeployController";

const router = Router();

// Wireado de dependencias
const deployService = new DeployService();
const deployController = new DeployController(deployService);

router.get("/", deployController.listAll);
router.get("/:id", deployController.getById);
router.post("/", deployController.createDeploy);
router.put("/:id", deployController.updateDeploy);
router.delete("/:id", deployController.deleteDeploy);

export default router;
