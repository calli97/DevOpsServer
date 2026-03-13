const Colors = {
  reset: "\x1b[0m",
  info: "\x1b[36m",      // Cyan
  warning: "\x1b[33m",   // Yellow
  success: "\x1b[32m",   // Green
  error: "\x1b[31m",     // Red
  dim: "\x1b[2m",        // Dim for timestamp
} as const;

type LogLevel = "INFO" | "WARNING" | "SUCCESS" | "ERROR";

class LogService {
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatArgs(args: unknown[]): string {
    return args
      .map((arg) => {
        if (typeof arg === "object" && arg !== null) {
          return JSON.stringify(arg, null, 2);
        }
        return String(arg);
      })
      .join(" ");
  }

  private log(level: LogLevel, color: string, ...args: unknown[]): void {
    const timestamp = this.getTimestamp();
    const message = this.formatArgs(args);
    const prefix = `${Colors.dim}[${timestamp}]${Colors.reset} ${color}[${level}]${Colors.reset}`;

    console.log(`${prefix} ${message}`);
  }

  info(...args: unknown[]): void {
    this.log("INFO", Colors.info, ...args);
  }

  warning(...args: unknown[]): void {
    this.log("WARNING", Colors.warning, ...args);
  }

  success(...args: unknown[]): void {
    this.log("SUCCESS", Colors.success, ...args);
  }

  error(...args: unknown[]): void {
    this.log("ERROR", Colors.error, ...args);
  }
}

export const logger = new LogService();
export { LogService };
