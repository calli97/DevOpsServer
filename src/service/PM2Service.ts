import { exec } from "child_process";
import { promisify } from "util";
import { logger } from "./LogService";

const execAsync = promisify(exec);

class PM2Service {
  static async listAll() {
    const { stdout, stderr } = await execAsync("pm2 ls");
    if (stderr) {
      return logger.warning(stderr);
    }
    logger.info(stdout);
  }
}

export default PM2Service;
