import { Request, Response } from "express";
import { DeployService } from "../service/DeployService";
import {
  WebhookPayload,
  WebhookPayloadPushCommit,
} from "../utils/github/types";
import { getBranch, isCommitPusshedWebhook } from "../utils/github/parser";
import { logger } from "../service/LogService";

export class GitHubWebhookController {
  constructor(private deployService: DeployService) {}

  receiveWebhook = async (req: Request, res: Response) => {
    const payload: WebhookPayload = req.body;

    if (isCommitPusshedWebhook(payload)) {
      const pushPayload = payload as WebhookPayloadPushCommit;
      const branch = getBranch(pushPayload);
      const repository = pushPayload.repository.clone_url;

      // Find deploys matching this repo and branch
      const deploys = await this.deployService.findByRepositoryAndBranch(
        repository,
        branch,
      );

      // Auto-update deploys that have autoUpdate enabled
      for (const deploy of deploys) {
        if (deploy.autoUpdate) {
          logger.info(`[Webhook] Auto-updating deploy: ${deploy.name}`);
          try {
            await this.deployService.runDeploy(deploy);
          } catch (error) {
            logger.error(`[Webhook] Failed to update ${deploy.name}:`, error);
          }
        }
      }

      return res.status(200).json({ ok: true });
    } else {
      return res.status(200).json({ ok: true });
    }
  };
}
