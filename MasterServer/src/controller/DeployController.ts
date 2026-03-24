import { Request, Response } from "express";
import { DeployService } from "../service/DeployService";
import { logger } from "../service/LogService";
import ProjectInstance from "../entity/ProjectInstance";

export class DeployController {
  constructor(private deployService: DeployService) {}

  listAll = async (req: Request, res: Response) => {
    try {
      const deploys = await this.deployService.findAll();
      return res.status(200).json({ ok: true, data: deploys });
    } catch (error) {
      logger.error("[DeployController] Error listing deploys:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deploy = await this.deployService.findById(Number(id));

      if (!deploy) {
        return res.status(404).json({ ok: false, error: `Deploy with id '${id}' not found` });
      }

      return res.status(200).json({ ok: true, data: deploy });
    } catch (error) {
      logger.error("[DeployController] Error getting deploy:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const { projectInstanceId, ...rest } = req.body;
      const deploy = await this.deployService.create({
        ...rest,
        projectInstance: { id: projectInstanceId } as ProjectInstance,
      });
      return res.status(201).json({ ok: true, data: deploy });
    } catch (error) {
      logger.error("[DeployController] Error creating deploy:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, startPath, buildCommands, startCommands, isStaticSite } = req.body;
      const deploy = await this.deployService.updateById(Number(id), {
        name,
        startPath,
        buildCommands,
        startCommands,
        isStaticSite,
      });

      if (!deploy) {
        return res.status(404).json({ ok: false, error: `Deploy with id '${id}' not found` });
      }

      return res.status(200).json({ ok: true, data: deploy });
    } catch (error) {
      logger.error("[DeployController] Error updating deploy:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await this.deployService.delete(Number(id));

      if (!deleted) {
        return res.status(404).json({ ok: false, error: `Deploy with id '${id}' not found` });
      }

      return res.status(200).json({ ok: true, message: "Deploy deleted" });
    } catch (error) {
      logger.error("[DeployController] Error deleting deploy:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  startDeploy = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deploy = await this.deployService.startOrRestart(Number(id));

      if (!deploy) {
        return res.status(404).json({ ok: false, error: `Deploy with id '${id}' not found` });
      }

      return res.status(200).json({ ok: true, data: deploy });
    } catch (error) {
      logger.error("[DeployController] Error starting deploy:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  stopDeploy = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deploy = await this.deployService.stopById(Number(id));

      if (!deploy) {
        return res.status(404).json({ ok: false, error: `Deploy with id '${id}' not found` });
      }

      return res.status(200).json({ ok: true, data: deploy });
    } catch (error) {
      logger.error("[DeployController] Error stopping deploy:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };
}
