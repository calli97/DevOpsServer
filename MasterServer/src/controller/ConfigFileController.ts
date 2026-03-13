import { Request, Response } from "express";
import { ConfigFileService } from "../service/ConfigFileService";
import { logger } from "../service/LogService";

export class ConfigFileController {
  constructor(private configFileService: ConfigFileService) {}

  listAll = async (req: Request, res: Response) => {
    try {
      const configFiles = await this.configFileService.findAll();
      return res.status(200).json({ ok: true, data: configFiles });
    } catch (error) {
      logger.error("[ConfigFileController] Error listing config files:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const configFile = await this.configFileService.findById(Number(id));

      if (!configFile) {
        return res.status(404).json({ ok: false, error: `ConfigFile with id '${id}' not found` });
      }

      return res.status(200).json({ ok: true, data: configFile });
    } catch (error) {
      logger.error("[ConfigFileController] Error getting config file:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const { projectId, ...rest } = req.body;
      const configFile = await this.configFileService.create({
        ...rest,
        project: { id: projectId } as any,
      });
      return res.status(201).json({ ok: true, data: configFile });
    } catch (error) {
      logger.error("[ConfigFileController] Error creating config file:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const configFile = await this.configFileService.update(Number(id), req.body);
      return res.status(200).json({ ok: true, data: configFile });
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).json({ ok: false, error: error.message });
      }
      logger.error("[ConfigFileController] Error updating config file:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await this.configFileService.delete(Number(id));

      if (!deleted) {
        return res.status(404).json({ ok: false, error: `ConfigFile with id '${id}' not found` });
      }

      return res.status(200).json({ ok: true, message: "ConfigFile deleted" });
    } catch (error) {
      logger.error("[ConfigFileController] Error deleting config file:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };
}
