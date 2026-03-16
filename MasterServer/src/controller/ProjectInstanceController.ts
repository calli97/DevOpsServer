import { Request, Response } from "express";
import { ProjectInstanceService } from "../service/ProjectInstanceService";
import { logger } from "../service/LogService";
import Project from "../entity/Project";
import SlaveServer from "../entity/SlaveServer";

export class ProjectInstanceController {
  constructor(private projectInstanceService: ProjectInstanceService) {}

  listAll = async (req: Request, res: Response) => {
    try {
      const instances = await this.projectInstanceService.findAll();
      return res.status(200).json({ ok: true, data: instances });
    } catch (error) {
      logger.error("[ProjectInstanceController] Error listing instances:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const instance = await this.projectInstanceService.findById(Number(id));
      return res.status(200).json({ ok: true, data: instance });
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).json({ ok: false, error: error.message });
      }
      logger.error("[ProjectInstanceController] Error getting instance:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const { projectId, slaveServerId, ...rest } = req.body;
      const instance = await this.projectInstanceService.create({
        ...rest,
        project: { id: projectId } as Project,
        slaveServer: slaveServerId ? ({ id: slaveServerId } as SlaveServer) : null,
      });

      const response: Record<string, any> = { ok: true, data: instance };
      if (!instance.cloned) {
        response.warning = "Failed to clone repository. You can retry by updating the instance.";
      }

      return res.status(201).json(response);
    } catch (error) {
      logger.error("[ProjectInstanceController] Error creating instance:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { slaveServerId, name, branch, path, autoUpdate, afterDeployCommands } = req.body;

      const data: Record<string, any> = { name, branch, path, autoUpdate, afterDeployCommands };

      if (slaveServerId !== undefined) {
        data.slaveServer = slaveServerId ? ({ id: slaveServerId } as SlaveServer) : null;
      }

      const instance = await this.projectInstanceService.updateById(Number(id), data);

      const response: Record<string, any> = { ok: true, data: instance };
      if (!instance.cloned) {
        response.warning = "Failed to clone repository. You can retry by updating the instance.";
      }

      return res.status(200).json(response);
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).json({ ok: false, error: error.message });
      }
      logger.error("[ProjectInstanceController] Error updating instance:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await this.projectInstanceService.delete(Number(id));

      if (!deleted) {
        return res.status(404).json({ ok: false, error: `ProjectInstance with id '${id}' not found` });
      }

      return res.status(200).json({ ok: true, message: "ProjectInstance deleted" });
    } catch (error) {
      logger.error("[ProjectInstanceController] Error deleting instance:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  startDeploys = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const instance = await this.projectInstanceService.findById(Number(id));
      const errors = await this.projectInstanceService.startDeploys(instance);

      if (errors.length > 0) {
        return res.status(500).json({
          ok: false,
          error: "Some deploys failed to start",
          failures: errors.map(({ deploy, error }) => ({
            deploy: deploy.name,
            error: error.message,
          })),
        });
      }

      return res.status(200).json({ ok: true, message: "All deploys started" });
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).json({ ok: false, error: error.message });
      }
      logger.error("[ProjectInstanceController] Error starting deploys:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  restartDeploys = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const instance = await this.projectInstanceService.findById(Number(id));
      const errors = await this.projectInstanceService.restartDeploys(instance);

      if (errors.length > 0) {
        return res.status(500).json({
          ok: false,
          error: "Some deploys failed to restart",
          failures: errors.map(({ deploy, error }) => ({
            deploy: deploy.name,
            error: error.message,
          })),
        });
      }

      return res.status(200).json({ ok: true, message: "All deploys restarted" });
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).json({ ok: false, error: error.message });
      }
      logger.error("[ProjectInstanceController] Error restarting deploys:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };
}
