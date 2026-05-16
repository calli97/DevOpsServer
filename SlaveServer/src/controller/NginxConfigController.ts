import { Request, Response } from "express";
import { NginxConfigService } from "../service/NginxConfigService";
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
}
