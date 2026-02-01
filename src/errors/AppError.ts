export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        name: this.name,
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        details: this.details,
      },
    };
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string | number) {
    super(
      identifier
        ? `${resource} with id '${identifier}' not found`
        : `${resource} not found`,
      "NOT_FOUND",
      404,
      { resource, identifier },
    );
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", 400, details);
  }
}

export class FileSystemError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "FILESYSTEM_ERROR", 500, details);
  }
}

export class ConfigFileError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "CONFIG_FILE_ERROR", 400, details);
  }
}
