export class AppError extends Error {
  statusCode: number;
  errorDetails?: unknown;

  constructor(statusCode: number, message: string, errorDetails?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.errorDetails = errorDetails;
    this.name = "AppError"; // so err.name reads "AppError" instead of generic "Error"

    Object.setPrototypeOf(this, AppError.prototype);

    // Excludes the AppError constructor itself from the stack trace,
    // so the trace starts at the line that actually threw it
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}