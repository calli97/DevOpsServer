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
  createDeploy = async (req: Request, res: Response) => {
    try {
      const deploy = await this.deployService.create(req.body);
      return res.status(201).json({ ok: true, data: deploy });
    } catch (error) {
      logger.error("[DeployController] Error creating deploy:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ ok: false, error: "Invalid ID" });
      }

      const deploy = await this.deployService.findById(id);
      if (!deploy) {
        return res.status(404).json({ ok: false, error: "Deploy not found" });
      }

      return res.status(200).json({ ok: true, data: deploy });
    } catch (error) {
      logger.error("[DeployController] Error getting deploy:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  updateDeploy = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ ok: false, error: "Invalid ID" });
      }

      const deploy = await this.deployService.updateById(id, req.body);
      if (!deploy) {
        return res.status(404).json({ ok: false, error: "Deploy not found" });
      }

      return res.status(200).json({ ok: true, data: deploy });
    } catch (error) {
      logger.error("[DeployController] Error updating deploy:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  deleteDeploy = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ ok: false, error: "Invalid ID" });
      }

      const deleted = await this.deployService.delete(id);
      if (!deleted) {
        return res.status(404).json({ ok: false, error: "Deploy not found" });
      }

      return res.status(200).json({ ok: true, message: "Deploy deleted" });
    } catch (error) {
      logger.error("[DeployController] Error deleting deploy:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };
}
