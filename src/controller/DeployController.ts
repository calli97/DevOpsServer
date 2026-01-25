import { Request, Response } from "express";
import { DeployService } from "../service/DeployService";

export class DeployController {
  constructor(private deployService: DeployService) {}

  listAll = async (req: Request, res: Response) => {
    try {
      const deploys = await this.deployService.listWithStatus();
      return res.status(200).json({ ok: true, data: deploys });
    } catch (error) {
      console.error("[DeployController] Error listing deploys:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };
}
