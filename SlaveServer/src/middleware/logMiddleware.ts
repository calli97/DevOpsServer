import { Request, Response, NextFunction } from "express";
import { logger } from "../service/LogService";

export function logMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const { method, originalUrl } = req;

  logger.info(`--> ${method} ${originalUrl}`);

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;

    if (statusCode >= 400) {
      logger.error(`<-- ${method} ${originalUrl} ${statusCode} (${duration}ms)`);
    } else {
      logger.success(`<-- ${method} ${originalUrl} ${statusCode} (${duration}ms)`);
    }
  });

  next();
}
