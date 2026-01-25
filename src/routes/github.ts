import { Router } from "express";
import { DeployService } from "../service/DeployService";
import { GitHubWebhookController } from "../controller/GitHubWebhookController";

const router = Router();

// Wireado de dependencias
const deployService = new DeployService();
const githubWebhookController = new GitHubWebhookController(deployService);

router.post("/webhook", githubWebhookController.receiveWebhook);

export default router;
