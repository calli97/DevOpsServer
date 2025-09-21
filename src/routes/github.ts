import { Router } from "express";
import GitHubWebhookController from "../controller/GitHubWebhookController";

const router = Router();

router.post("/webhook", GitHubWebhookController.receiveWebhook);

export default router;
