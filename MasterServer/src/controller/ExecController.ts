import { Request, Response } from "express";
import { promisify } from "util";
import { exec } from "child_process";
import * as fs from "fs/promises";
import { SlaveServerClient } from "../service/SlaveServerClient";
import { SlaveServerService } from "../service/SlaveServerService";
import { logger } from "../service/LogService";

const execAsync = promisify(exec);

interface ExecResult {
  ok: boolean;
  stdout: string;
  stderr: string;
}

export class ExecController {
  private readonly client = new SlaveServerClient();

  constructor(private readonly slaveServerService: SlaveServerService) {}

  exec = async (req: Request, res: Response): Promise<void> => {
    const { cmd, cwd, target } = req.body as { cmd: string; cwd: string; target: string };

    if (target === "master") {
      const result = await this.execLocal(cmd, cwd);
      res.status(200).json(result);
      return;
    }

    try {
      const slaveServer = await this.slaveServerService.findById(Number(target));
      const result = await this.client.exec(slaveServer, cmd, cwd);
      res.status(200).json(result);
    } catch (error: any) {
      if (error.statusCode === 404) {
        res.status(404).json({ ok: false, error: error.message });
        return;
      }
      logger.error("[ExecController] Error executing on slave:", error);
      res.status(500).json({ ok: false, error: error.message });
    }
  };

  private async execLocal(cmd: string, cwd: string): Promise<ExecResult> {
    try {
      const stat = await fs.stat(cwd);
      if (!stat.isDirectory()) {
        return { ok: false, stdout: "", stderr: `Directory does not exist: ${cwd}` };
      }
    } catch {
      return { ok: false, stdout: "", stderr: `Directory does not exist: ${cwd}` };
    }

    try {
      const { stdout, stderr } = await execAsync(cmd, { cwd });
      return { ok: true, stdout, stderr };
    } catch (error: any) {
      return {
        ok: false,
        stdout: error.stdout ?? "",
        stderr: error.stderr ?? String(error.message),
      };
    }
  }
}
