import { Request, Response } from "express";
import { DeployService } from "../service/DeployService";
import { logger } from "../service/LogService";

export class DeployController {
  constructor(private deployService: DeployService) {}

  listAll = async (req: Request, res: Response) => {
    try {
      const deploys = await this.deployService.listWithStatus();
      return res.status(200).json({ ok: true, data: deploys });
    } catch (error) {
      logger.error("[DeployController] Error listing deploys:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };
  createLocalDeploy = async (req: Request, res: Response) => {
    try {
      const deployBody = await this.deployService.create(req.body);
      return res.status(200).json({ ok: true, data: deployBody });
    } catch (error) {
      logger.error("[DeployController] Error listing deploys:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };
}
