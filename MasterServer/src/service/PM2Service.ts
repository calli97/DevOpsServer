import { exec } from "child_process";
import { promisify } from "util";
import { logger } from "./LogService";

const execAsync = promisify(exec);

class PM2Service {
  private sanitizeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, "");
  }

  async start(name: string, startCommands: string, cwd: string): Promise<{ stdout: string; stderr: string }> {
    const sanitizedName = this.sanitizeName(name);
    if (!sanitizedName) {
      throw new Error(`Invalid deploy name: ${name}`);
    }

    const { stdout, stderr } = await execAsync(
      `pm2 start "${startCommands}" --name ${sanitizedName}`,
      { cwd },
    );

    logger.info(`[PM2Service] PM2 start ${sanitizedName}:`, stdout);
    if (stderr) logger.warning(`[PM2Service] stderr:`, stderr);

    return { stdout, stderr };
  }

  async restart(name: string, cwd: string): Promise<{ stdout: string; stderr: string }> {
    const sanitizedName = this.sanitizeName(name);
    if (!sanitizedName) {
      throw new Error(`Invalid deploy name: ${name}`);
    }

    const { stdout, stderr } = await execAsync(`pm2 restart ${sanitizedName}`, {
      cwd,
    });

    logger.info(`[PM2Service] PM2 restart ${sanitizedName}:`, stdout);
    if (stderr) logger.warning(`[PM2Service] stderr:`, stderr);

    return { stdout, stderr };
  }

  async stop(name: string, cwd: string): Promise<{ stdout: string; stderr: string }> {
    const sanitizedName = this.sanitizeName(name);
    if (!sanitizedName) {
      throw new Error(`Invalid deploy name: ${name}`);
    }

    const { stdout, stderr } = await execAsync(`pm2 stop ${sanitizedName}`, {
      cwd,
    });

    logger.info(`[PM2Service] PM2 stop ${sanitizedName}:`, stdout);
    if (stderr) logger.warning(`[PM2Service] stderr:`, stderr);

    return { stdout, stderr };
  }

  async delete(name: string): Promise<{ stdout: string; stderr: string }> {
    const sanitizedName = this.sanitizeName(name);
    if (!sanitizedName) {
      throw new Error(`Invalid deploy name: ${name}`);
    }

    const { stdout, stderr } = await execAsync(`pm2 delete ${sanitizedName}`);

    logger.info(`[PM2Service] PM2 delete ${sanitizedName}:`, stdout);
    if (stderr) logger.warning(`[PM2Service] stderr:`, stderr);

    return { stdout, stderr };
  }
}

export default PM2Service;
