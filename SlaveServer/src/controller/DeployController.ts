import { Request, Response } from "express";
import path from "path";
import { DeployRequest, DeployResponse, DeployErrorDto, DeployDto, StopRequest, StopResponse } from "../dto/slave.dto";
import { GitService } from "../service/GitService";
import { ConfigFileService } from "../service/ConfigFileService";
import { NginxConfigService } from "../service/NginxConfigService";
import { DeployService } from "../service/DeployService";
import { logger } from "../service/LogService";

export class DeployController {
  constructor(
    private readonly gitService: GitService,
    private readonly configFileService: ConfigFileService,
    private readonly nginxConfigService: NginxConfigService,
    private readonly deployService: DeployService,
  ) {}

  startOrRestartDeploys = async (req: Request, res: Response): Promise<void> => {
    const { instancePath, branch, cloneLine, deploys, configFiles, nginxConfigs } =
      req.body as DeployRequest;

    const repoDir = this.gitService.getProjectDirectoryName(cloneLine);
    const instanceDir = path.join(instancePath, repoDir);

    try {
      await this.gitService.pull(instanceDir, branch);
    } catch (error) {
      logger.error("[DeployController] git pull failed:", error);
      const response: DeployResponse = {
        ok: false,
        errors: [{ deployName: "__git_pull__", error: error instanceof Error ? error.message : String(error) }],
      };
      res.status(500).json(response);
      return;
    }

    try {
      await this.configFileService.writeFilesForInstance(configFiles, instanceDir);
    } catch (error) {
      logger.error("[DeployController] Config file write failed:", error);
      const response: DeployResponse = {
        ok: false,
        errors: [{ deployName: "__config_files__", error: error instanceof Error ? error.message : String(error) }],
      };
      res.status(500).json(response);
      return;
    }

    const succeeded: DeployDto[] = [];
    const errors: DeployErrorDto[] = [];

    for (const deploy of deploys) {
      try {
        const result = deploy.started
          ? await this.deployService.restart(instanceDir, deploy)
          : await this.deployService.start(instanceDir, deploy);

        if (result.stderr) {
          errors.push({ deployName: deploy.name, error: result.stderr });
        } else {
          succeeded.push(deploy);
        }
      } catch (error) {
        errors.push({
          deployName: deploy.name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (errors.length > 0) {
      for (const deploy of succeeded) {
        try {
          await this.deployService.stop(instanceDir, deploy);
        } catch {}
      }
    }

    if (errors.length === 0 && nginxConfigs.length > 0) {
      try {
        await this.nginxConfigService.writeAndApply(nginxConfigs);
      } catch (error) {
        logger.error("[DeployController] nginx config failed:", error);
        errors.push({
          deployName: "__nginx__",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const response: DeployResponse = {
      ok: errors.length === 0,
      errors,
    };

    res.status(200).json(response);
  };

  stopDeploy = async (req: Request, res: Response): Promise<void> => {
    const { instancePath, cloneLine, deployName, startPath } = req.body as StopRequest;
    const repoDir = this.gitService.getProjectDirectoryName(cloneLine);
    const instanceDir = path.join(instancePath, repoDir);

    try {
      await this.deployService.stop(instanceDir, {
        name: deployName,
        startPath,
        buildCommands: null,
        startCommands: "",
        started: true,
        isStaticSite: false,
      });
      const response: StopResponse = { ok: true };
      res.status(200).json(response);
    } catch (error) {
      logger.error("[DeployController] stop failed:", error);
      const response: StopResponse = {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
      res.status(500).json(response);
    }
  };
}
