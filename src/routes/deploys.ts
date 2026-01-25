import { Router } from "express";
import { DeployService } from "../service/DeployService";
import { DeployController } from "../controller/DeployController";

const router = Router();

// Wireado de dependencias
const deployService = new DeployService();
const deployController = new DeployController(deployService);

router.get("/", deployController.listAll);

export default router;
