import { Request, Response } from "express";
import { ProjectService } from "../service/ProjectService";
import { logger } from "../service/LogService";

export class ProjectController {
  constructor(private projectService: ProjectService) {}

  listAll = async (req: Request, res: Response) => {
    try {
      const projects = await this.projectService.findAll();
      return res.status(200).json({ ok: true, data: projects });
    } catch (error) {
      logger.error("[ProjectController] Error listing projects:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const project = await this.projectService.findById(Number(id));
      return res.status(200).json({ ok: true, data: project });
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).json({ ok: false, error: error.message });
      }
      logger.error("[ProjectController] Error getting project:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const project = await this.projectService.create(req.body);
      return res.status(201).json({ ok: true, data: project });
    } catch (error) {
      logger.error("[ProjectController] Error creating project:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const project = await this.projectService.updateById(Number(id), req.body);
      return res.status(200).json({ ok: true, data: project });
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).json({ ok: false, error: error.message });
      }
      logger.error("[ProjectController] Error updating project:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await this.projectService.delete(Number(id));

      if (!deleted) {
        return res.status(404).json({ ok: false, error: "Project not found" });
      }

      return res.status(200).json({ ok: true, message: "Project deleted" });
    } catch (error) {
      logger.error("[ProjectController] Error deleting project:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  startDeploys = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const project = await this.projectService.findById(Number(id));
      const errors = await this.projectService.startDeploys(project);

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
      logger.error("[ProjectController] Error starting deploys:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  restartDeploys = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const project = await this.projectService.findById(Number(id));
      const errors = await this.projectService.restartDeploys(project);

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
      logger.error("[ProjectController] Error restarting deploys:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };
}
