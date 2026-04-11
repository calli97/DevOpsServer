import { Request, Response } from "express";
import { GitService } from "../service/GitService";
import { CloneRequest, CloneResponse } from "../dto/slave.dto";
import { logger } from "../service/LogService";

export class CloneController {
  constructor(private readonly gitService: GitService) {}

  clone = async (req: Request, res: Response): Promise<void> => {
    const { cloneLine, path } = req.body as CloneRequest;

    try {
      await this.gitService.clone(cloneLine, path);
      const response: CloneResponse = { ok: true, cloned: true };
      res.status(200).json(response);
    } catch (error) {
      logger.error("[CloneController] Clone failed:", error);
      const response: CloneResponse = {
        ok: false,
        cloned: false,
        error: error instanceof Error ? error.message : String(error),
      };
      res.status(500).json(response);
    }
  };
}
