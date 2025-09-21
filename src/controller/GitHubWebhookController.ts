import { Request, Response } from "express";

class GitHubWebhookController {
  static async receiveWebhook(req: Request, res: Response) {
    console.log(req);
    res.status(200).json({ ok: true });
  }
}

export default GitHubWebhookController;
