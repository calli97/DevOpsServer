import { Request, Response } from "express";
import {
  WebhookPayload,
  WebhookPayloadPushCommit,
} from "../utils/github/types";
import { getBranch, isCommitPusshedWebhook } from "../utils/github/parser";
import { logger } from "../service/LogService";
import { ProjectInstanceService } from "../service/ProjectInstanceService";

export class GitHubWebhookController {
  constructor(private projectInstanceService: ProjectInstanceService) {}

  receiveWebhook = async (req: Request, res: Response) => {
    const payload: WebhookPayload = req.body;

    if (isCommitPusshedWebhook(payload)) {
      const pushPayload = payload as WebhookPayloadPushCommit;
      const branch = getBranch(pushPayload);
      const repository = pushPayload.repository.clone_url;

      const projects =
        await this.projectInstanceService.getByRepositoryNameAndBranch(
          repository,
          branch,
        );

      for (const project of projects) {
        if (project.autoUpdate) {
          logger.info(`[Webhook] Auto-updating project: ${project.name}`);
          try {
            const errors =
              await this.projectInstanceService.restartDeploys(project);
            if (errors.length > 0) {
              for (const { deploy, error } of errors) {
                logger.error(
                  `[Webhook] Failed to restart deploy ${deploy.name}:`,
                  error,
                );
              }
            }
          } catch (error) {
            logger.error(`[Webhook] Failed to update ${project.name}:`, error);
          }
        }
      }

      return res.status(200).json({ ok: true });
    } else {
      return res.status(200).json({ ok: true });
    }
  };
}
