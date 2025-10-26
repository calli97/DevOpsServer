import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { getRepository } from "../dbConnection";
import { promisify } from "util";
import { exec } from "child_process";

const execAsync = promisify(exec);

@Entity()
class Deploy {
  // Helper method to sanitize shell inputs
  private sanitizeName(name: string): string {
    // Remove potentially dangerous characters, only allow alphanumeric, hyphens, and underscores
    return name.replace(/[^a-zA-Z0-9_-]/g, '');
  }
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  path: string;

  @Column({ nullable: false })
  repository: string;

  @Column({ nullable: false })
  branch: string;

  @Column({ nullable: true })
  buildCommands: string;

  @Column({ nullable: false })
  startCommands: string;

  @Column({ nullable: true })
  port: number;

  @Column({ nullable: false, default: false })
  expose: boolean;

  @Column({ nullable: false, default: true })
  active: boolean;

  static async storeNewDeploy(
    name: string,
    path: string,
    gitRepository: string,
    branch: string,
    expose: boolean,
    active: boolean,
    buildCommands: string,
    startCommands: string,
    port: number
  ) {
    const repository = await getRepository(Deploy);

    const newDeploy = new Deploy();
    newDeploy.name = name;
    newDeploy.path = path;
    (newDeploy.repository = gitRepository), (newDeploy.branch = branch);
    newDeploy.expose = expose;
    newDeploy.active = active;
    newDeploy.buildCommands = buildCommands;
    newDeploy.startCommands = startCommands;
    newDeploy.port = port;
    return await repository.save(newDeploy);
  }

  async storeStartCmd(): Promise<{ stdout: string; stderr: string }> {
    try {
      const sanitizedName = this.sanitizeName(this.name);
      if (!sanitizedName) {
        throw new Error(`Invalid deploy name: ${this.name}`);
      }

      const { stdout, stderr } = await execAsync(
        `pm2 start "${this.startCommands}" --name ${sanitizedName}`,
        {
          cwd: this.path,
        }
      );

      console.log(`[Deploy ${sanitizedName}] PM2 start output:`, stdout);
      if (stderr) {
        console.warn(`[Deploy ${sanitizedName}] PM2 start stderr:`, stderr);
      }

      return { stdout, stderr };
    } catch (error) {
      console.error(`[Deploy ${this.name}] Failed to start:`, error);
      throw new Error(`Failed to start deploy ${this.name}: ${error.message}`);
    }
  }

  async restart(): Promise<{ stdout: string; stderr: string }> {
    try {
      const sanitizedName = this.sanitizeName(this.name);
      if (!sanitizedName) {
        throw new Error(`Invalid deploy name: ${this.name}`);
      }

      const { stdout, stderr } = await execAsync(`pm2 restart ${sanitizedName}`, {
        cwd: this.path,
      });

      console.log(`[Deploy ${sanitizedName}] PM2 restart output:`, stdout);
      if (stderr) {
        console.warn(`[Deploy ${sanitizedName}] PM2 restart stderr:`, stderr);
      }

      return { stdout, stderr };
    } catch (error) {
      console.error(`[Deploy ${this.name}] Failed to restart:`, error);
      throw new Error(`Failed to restart deploy ${this.name}: ${error.message}`);
    }
  }

  async runBuildCmds(): Promise<{ stdout: string; stderr: string }> {
    try {
      // Validate buildCommands exists
      if (!this.buildCommands) {
        console.log(`[Deploy ${this.name}] No build commands to execute`);
        return { stdout: '', stderr: '' };
      }

      // Parse and validate JSON
      let cmds: Array<string>;
      try {
        cmds = JSON.parse(this.buildCommands);
      } catch (parseError) {
        throw new Error(`Invalid JSON in buildCommands: ${parseError.message}`);
      }

      // Validate it's an array with at least one command
      if (!Array.isArray(cmds) || cmds.length === 0) {
        throw new Error('buildCommands must be a non-empty array of strings');
      }

      // Validate all commands are strings
      if (!cmds.every(cmd => typeof cmd === 'string')) {
        throw new Error('All build commands must be strings');
      }

      console.log(`[Deploy ${this.name}] Running build commands:`, cmds);

      const { stdout, stderr } = await execAsync(cmds.join(" && "), {
        cwd: this.path,
      });

      console.log(`[Deploy ${this.name}] Build output:`, stdout);
      if (stderr) {
        console.warn(`[Deploy ${this.name}] Build stderr:`, stderr);
      }

      return { stdout, stderr };
    } catch (error) {
      console.error(`[Deploy ${this.name}] Failed to run build commands:`, error);
      throw new Error(`Failed to run build commands for ${this.name}: ${error.message}`);
    }
  }

  async stop(): Promise<{ stdout: string; stderr: string }> {
    try {
      const sanitizedName = this.sanitizeName(this.name);
      if (!sanitizedName) {
        throw new Error(`Invalid deploy name: ${this.name}`);
      }

      const { stdout, stderr } = await execAsync(`pm2 stop ${sanitizedName}`, {
        cwd: this.path,
      });

      console.log(`[Deploy ${sanitizedName}] PM2 stop output:`, stdout);
      if (stderr) {
        console.warn(`[Deploy ${sanitizedName}] PM2 stop stderr:`, stderr);
      }

      return { stdout, stderr };
    } catch (error) {
      console.error(`[Deploy ${this.name}] Failed to stop:`, error);
      throw new Error(`Failed to stop deploy ${this.name}: ${error.message}`);
    }
  }

  // Verify and sync process status with PM2
  async syncStatusWithPM2(): Promise<boolean> {
    try {
      const sanitizedName = this.sanitizeName(this.name);
      if (!sanitizedName) {
        throw new Error(`Invalid deploy name: ${this.name}`);
      }

      const { stdout, stderr } = await execAsync("pm2 jlist");

      // Check if stdout is empty or contains error messages
      if (!stdout || stdout.trim().length === 0) {
        console.warn(`[Deploy ${this.name}] PM2 returned empty output`);
        if (this.active !== false) {
          this.active = false;
          const repository = await getRepository(Deploy);
          await repository.save(this);
        }
        return false;
      }

      let processes;
      try {
        processes = JSON.parse(stdout);
      } catch (parseError) {
        console.error(`[Deploy ${this.name}] Failed to parse PM2 output:`, stdout.substring(0, 200));
        throw new Error(`Invalid JSON from PM2: ${parseError.message}`);
      }

      const process = processes.find((p: any) => p.name === sanitizedName);

      const isRunning = process && process.pm2_env.status === "online";

      // Update database if status differs
      if (this.active !== isRunning) {
        this.active = isRunning;
        const repository = await getRepository(Deploy);
        await repository.save(this);
        console.log(`[Deploy ${this.name}] Status synced: ${isRunning ? "active" : "inactive"}`);
      }

      return isRunning;
    } catch (error) {
      console.error(`[Deploy ${this.name}] Failed to sync status:`, error);
      // If PM2 is not responding, assume process is not running
      if (this.active !== false) {
        this.active = false;
        const repository = await getRepository(Deploy);
        await repository.save(this);
      }
      return false;
    }
  }

  // Static method to list all processes with their current status
  static async listProcessesWithStatus(): Promise<Array<{ deploy: Deploy; isRunning: boolean }>> {
    const repository = await getRepository(Deploy);
    const deploys = await repository.find();

    // Sync status for all deploys
    const deploysWithStatus = await Promise.all(
      deploys.map(async (deploy) => {
        const isRunning = await deploy.syncStatusWithPM2();
        return {
          deploy,
          isRunning,
        };
      })
    );

    return deploysWithStatus;
  }
}

export default Deploy;
