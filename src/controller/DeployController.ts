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
      const { id } = req.params;
      const deploy = await this.deployService.findById(Number(id));

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
      const { id } = req.params;
      const deploy = await this.deployService.updateById(Number(id), req.body);

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
      const { id } = req.params;
      const deleted = await this.deployService.delete(Number(id));

      if (!deleted) {
        return res.status(404).json({ ok: false, error: "Deploy not found" });
      }

      return res.status(200).json({ ok: true, message: "Deploy deleted" });
    } catch (error) {
      logger.error("[DeployController] Error deleting deploy:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  runDeploy = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deploy = await this.deployService.findById(Number(id));

      if (deploy.slaveServer) {
        //External server
      } else {
        //Intern server
        await this.deployService.runDeploy(deploy);
      }
      res.status(400).json({ ok: true });
    } catch (error) {
      logger.error("[DeployController] Error deleting deploy:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };
}
