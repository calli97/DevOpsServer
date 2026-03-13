import { Request, Response } from "express";
import { SlaveServerService } from "../service/SlaveServerService";
import { logger } from "../service/LogService";

export class SlaveServerController {
  constructor(private slaveServerService: SlaveServerService) {}

  listAll = async (req: Request, res: Response) => {
    try {
      const slaveServers = await this.slaveServerService.findAll();
      return res.status(200).json({ ok: true, data: slaveServers });
    } catch (error) {
      logger.error("[SlaveServerController] Error listing slave servers:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const slaveServer = await this.slaveServerService.findById(Number(id));
      return res.status(200).json({ ok: true, data: slaveServer });
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).json({ ok: false, error: error.message });
      }
      logger.error("[SlaveServerController] Error getting slave server:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const slaveServer = await this.slaveServerService.create(req.body);
      return res.status(201).json({ ok: true, data: slaveServer });
    } catch (error) {
      logger.error("[SlaveServerController] Error creating slave server:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const slaveServer = await this.slaveServerService.updateById(Number(id), req.body);
      return res.status(200).json({ ok: true, data: slaveServer });
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).json({ ok: false, error: error.message });
      }
      logger.error("[SlaveServerController] Error updating slave server:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await this.slaveServerService.delete(Number(id));

      if (!deleted) {
        return res.status(404).json({ ok: false, error: `SlaveServer with id '${id}' not found` });
      }

      return res.status(200).json({ ok: true, message: "SlaveServer deleted" });
    } catch (error) {
      logger.error("[SlaveServerController] Error deleting slave server:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  };
}
