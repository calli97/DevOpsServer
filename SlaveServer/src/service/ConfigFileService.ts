import * as fs from "fs/promises";
import * as path from "path";
import { ConfigFileDto } from "../dto/slave.dto";
import { ConfigFileError } from "../errors/AppError";
import { logger } from "./LogService";

export class ConfigFileService {
  async writeFilesForInstance(configFiles: ConfigFileDto[], projectDir: string): Promise<void> {
    if (configFiles.length === 0) {
      return;
    }

    const missingDirectories: string[] = [];

    for (const configFile of configFiles) {
      const dirPath = path.join(projectDir, configFile.relativePath);

      try {
        const stat = await fs.stat(dirPath);
        if (!stat.isDirectory()) {
          missingDirectories.push(dirPath);
        }
      } catch {
        missingDirectories.push(dirPath);
      }
    }

    if (missingDirectories.length > 0) {
      throw new ConfigFileError(
        `Cannot write config files: missing directories`,
        { missingDirectories },
      );
    }

    for (const configFile of configFiles) {
      const filePath = path.join(projectDir, configFile.relativePath, configFile.name);
      await fs.writeFile(filePath, configFile.content, "utf-8");
      logger.info(`[ConfigFileService] Written: ${filePath}`);
    }
  }
}
