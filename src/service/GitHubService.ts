import { createHmac } from "crypto";
import { NextFunction, Response } from "express";
import config from "../config";

export class GitHubService {
  verifySignature(signature: string, body: any): boolean {
    const hmac = createHmac("sha1", config.githubWebhookSecret);
    const digest = `sha1=${hmac.update(JSON.stringify(body)).digest("hex")}`;
    return signature === digest;
  }

  verifySignatureMiddleware = (
    signature: string,
    body: any,
    next: NextFunction,
    res: Response
  ) => {
    console.log("BODY:", body);

    if (!this.verifySignature(signature, body)) {
      return res.status(401).json({ error: true, msg: "Invalid signature" });
    }
    next();
  };
}
