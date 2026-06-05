import { promisify } from "util";
import { exec } from "child_process";
import * as fs from "fs/promises";

const execAsync = promisify(exec);

export interface ExecResult {
  ok: boolean;
  stdout: string;
  stderr: string;
}

export class ExecService {
  async run(cmd: string, cwd: string): Promise<ExecResult> {
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
