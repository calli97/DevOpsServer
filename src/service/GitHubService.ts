import { createHmac } from "crypto";
import { NextFunction, Response } from "express";
import config from "../config";

class GitHubService {
  static verifyGithubSignture = (
    signature: string,
    body: any,
    next: NextFunction,
    res: Response
  ) => {
    const hmac = createHmac("sha1", config.githubWebhookSecret);
    const digest = `sha1=${hmac.update(JSON.stringify(body)).digest("hex")}`;

    if (signature !== digest) {
      return res.status(401).json({ error: true, msg: "Invalid signature" });
    }
    next();
  };
}

export default GitHubService;
