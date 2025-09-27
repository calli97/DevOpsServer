import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

class PM2Service {
  static async listAll() {
    const { stdout, stderr } = await execAsync("pm2 ls");
    if (stderr) {
      return console.log(stderr);
    }
    console.log(stdout);
  }
}

export default PM2Service;
