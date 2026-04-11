import { exec } from "child_process";
import { promisify } from "util";
import { logger } from "./LogService";

const execAsync = promisify(exec);

export class GitService {
  getProjectDirectoryName(cloneLine: string): string {
    const repoWithExtension = cloneLine.split("/").pop() || "";
    return repoWithExtension.replace(/\.git$/, "");
  }

  async clone(cloneLine: string, targetPath: string): Promise<void> {
    logger.info(`[GitService] Cloning ${cloneLine} into ${targetPath}`);
    await execAsync(`git clone ${cloneLine}`, { cwd: targetPath });
    logger.success(`[GitService] Clone completed`);
  }

  async pull(repoPath: string, branch: string): Promise<void> {
    logger.info(`[GitService] Pulling branch ${branch} at ${repoPath}`);
    await execAsync(`git pull origin ${branch}`, { cwd: repoPath });
    await execAsync(`git switch ${branch}`, { cwd: repoPath });
    logger.success(`[GitService] Pull completed`);
  }
}
