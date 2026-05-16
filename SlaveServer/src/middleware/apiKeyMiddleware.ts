import { Request, Response, NextFunction } from "express";
import { createHmac, timingSafeEqual } from "crypto";
import config from "../config";

const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000;

export function apiKeyMiddleware(req: Request, res: Response, next: NextFunction): void {
  const timestamp = req.headers["x-timestamp"] as string;
  const signature = req.headers["x-signature"] as string;

  if (!timestamp || !signature) {
    res.status(401).json({ ok: false, error: "Missing auth headers" });
    return;
  }

  const ts = Number(timestamp);
  if (isNaN(ts) || Math.abs(Date.now() - ts) > TIMESTAMP_TOLERANCE_MS) {
    res.status(401).json({ ok: false, error: "Request timestamp out of range" });
    return;
  }

  const rawBody = (req as any).rawBody as Buffer | undefined;
  const bodyStr = rawBody ? rawBody.toString("utf8") : "";

  const payload = `${req.method}\n${req.path}\n${timestamp}\n${bodyStr}`;
  const expected = createHmac("sha256", config.apiKey).update(payload).digest("hex");
  const actual = signature.startsWith("sha256=") ? signature.slice(7) : signature;

  try {
    const expectedBuf = Buffer.from(expected, "hex");
    const actualBuf = Buffer.from(actual, "hex");
    if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
      throw new Error();
    }
  } catch {
    res.status(401).json({ ok: false, error: "Invalid signature" });
    return;
  }

  next();
}
