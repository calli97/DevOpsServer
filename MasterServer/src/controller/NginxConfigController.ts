import { Request, Response } from "express";
import { NginxConfigService } from "../service/NginxConfigService";
import { logger } from "../service/LogService";
import ProjectInstance from "../entity/ProjectInstance";

export class NginxConfigController {
  constructor(private nginxConfigService: NginxConfigService) {}

  listByInstance = async (req: Request, res: Response) => {
    try {
      const { instanceId } = req.params;
      const nginxConfigs = await this.nginxConfigService.findByProjectInstance(Number(instanceId));
      return res.status(200).json({ ok: true, data: nginxConfigs });
    } catch (error) {
      logger.error("[NginxConfigController] Error listing nginx configs:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const { projectInstanceId, ...rest } = req.body;
      const nginxConfig = await this.nginxConfigService.create({
        ...rest,
        projectInstance: { id: projectInstanceId } as ProjectInstance,
      });
      return res.status(201).json({ ok: true, data: nginxConfig });
    } catch (error) {
      logger.error("[NginxConfigController] Error creating nginx config:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, path, content, command } = req.body;
      const nginxConfig = await this.nginxConfigService.update(Number(id), {
        name,
        path,
        content,
        command,
      });
      return res.status(200).json({ ok: true, data: nginxConfig });
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).json({ ok: false, error: error.message });
      }
      logger.error("[NginxConfigController] Error updating nginx config:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await this.nginxConfigService.delete(Number(id));

      if (!deleted) {
        return res.status(404).json({ ok: false, error: `NginxConfig with id '${id}' not found` });
      }

      return res.status(200).json({ ok: true, message: "NginxConfig deleted" });
    } catch (error) {
      logger.error("[NginxConfigController] Error deleting nginx config:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  runCommands = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const nginxConfig = await this.nginxConfigService.findById(Number(id));

      if (!nginxConfig) {
        return res.status(404).json({ ok: false, error: `NginxConfig with id '${id}' not found` });
      }

      const { stdout, stderr } = await this.nginxConfigService.runCommands(nginxConfig);

      if (stderr) {
        return res.status(200).json({ ok: false, stdout, stderr });
      }

      return res.status(200).json({ ok: true, stdout, stderr });
    } catch (error) {
      logger.error("[NginxConfigController] Error running nginx config commands:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  testConfig = async (req: Request, res: Response) => {
    try {
      const result = await this.nginxConfigService.testConfig();
      return res.status(200).json(result);
    } catch (error) {
      logger.error("[NginxConfigController] Error testing nginx config:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  reload = async (req: Request, res: Response) => {
    try {
      const result = await this.nginxConfigService.reload();
      return res.status(200).json(result);
    } catch (error) {
      logger.error("[NginxConfigController] Error reloading nginx:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  syncStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await this.nginxConfigService.syncStatus(Number(id));
      return res.status(result.ok ? 200 : 500).json(result);
    } catch (error) {
      logger.error("[NginxConfigController] Error checking sync status:", error);
      return res.status(500).json({ ok: false, inSync: false, error: error.message });
    }
  };

  forceSync = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { source } = req.body as { source: "stored" | "current" };
      const result = await this.nginxConfigService.forceSync(Number(id), source);
      return res.status(result.ok ? 200 : 500).json(result);
    } catch (error) {
      logger.error("[NginxConfigController] Error forcing sync:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };
}
