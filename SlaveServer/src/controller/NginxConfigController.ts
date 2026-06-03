import { Request, Response } from "express";
import { NginxConfigService } from "../service/NginxConfigService";
import { NginxRunCommandsRequest, NginxDeleteFileRequest } from "../dto/slave.dto";
import { logger } from "../service/LogService";

export class NginxConfigController {
  constructor(private readonly nginxConfigService: NginxConfigService) {}

  readFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { path: filePath, name } = req.query as { path: string; name: string };
      const content = await this.nginxConfigService.readFile(filePath, name);
      res.status(200).json({ ok: true, content });
    } catch (error) {
      logger.error("[NginxConfigController] Error reading file:", error);
      res.status(500).json({ ok: false, error: error.message });
    }
  };

  writeFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { path: filePath, name, content } = req.body;
      await this.nginxConfigService.writeFileOnly(filePath, name, content);
      res.status(200).json({ ok: true });
    } catch (error) {
      logger.error("[NginxConfigController] Error writing file:", error);
      res.status(500).json({ ok: false, error: error.message });
    }
  };

  runCommands = async (req: Request, res: Response): Promise<void> => {
    try {
      const { command } = req.body as NginxRunCommandsRequest;
      const result = await this.nginxConfigService.runCommands(command);
      res.status(200).json({ ok: true, ...result });
    } catch (error) {
      logger.error("[NginxConfigController] Error running commands:", error);
      res.status(500).json({ ok: false, error: error.message });
    }
  };

  deleteFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { path: filePath, name } = req.body as NginxDeleteFileRequest;
      await this.nginxConfigService.deleteFile(filePath, name);
      res.status(200).json({ ok: true });
    } catch (error) {
      logger.error("[NginxConfigController] Error deleting file:", error);
      res.status(500).json({ ok: false, error: error.message });
    }
  };

  testConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.nginxConfigService.testConfig();
      res.status(200).json(result);
    } catch (error) {
      logger.error("[NginxConfigController] Error testing nginx config:", error);
      res.status(500).json({ ok: false, error: error.message });
    }
  };

  reload = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.nginxConfigService.reload();
      res.status(200).json(result);
    } catch (error) {
      logger.error("[NginxConfigController] Error reloading nginx:", error);
      res.status(500).json({ ok: false, error: error.message });
    }
  };
}
