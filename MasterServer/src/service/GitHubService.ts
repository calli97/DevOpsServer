import { createHmac } from "crypto";
import { NextFunction, Response } from "express";
import config from "../config";
import { logger } from "./LogService";

export class GitHubService {
  verifySignature(signature: string, rawBody: Buffer): boolean {
    const hmac = createHmac("sha1", config.githubWebhookSecret);
    const digest = `sha1=${hmac.update(rawBody).digest("hex")}`;
    return signature === digest;
  }

  getProjectDirectoryName(cloneLine: string): string {
    const repoWithExtension = cloneLine.split("/").pop() || "";
    return repoWithExtension.replace(/\.git$/, "");
  }

  verifySignatureMiddleware = (
    signature: string,
    rawBody: Buffer,
    next: NextFunction,
    res: Response
  ) => {
    if (!this.verifySignature(signature, rawBody)) {
      return res.status(401).json({ error: true, msg: "Invalid signature" });
    }
    next();
  };
}
