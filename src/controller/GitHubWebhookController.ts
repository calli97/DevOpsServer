import { Request, Response } from "express";
import {
  WebhookPayload,
  WebhookPayloadPushCommit,
} from "../utils/github/types";
import { getBranch, isCommitPusshedWebhook } from "../utils/github/parser";

class GitHubWebhookController {
  static async receiveWebhook(req: Request, res: Response) {
    const payload: WebhookPayload = req.body;

    if (isCommitPusshedWebhook(payload)) {
      const pushPayload: WebhookPayloadPushCommit = payload as any;
      const branch = getBranch(pushPayload);

      return res.status(200).json({ ok: true });
    } else {
      return res.status(200).json({ ok: true });
    }
  }
}

export default GitHubWebhookController;
