export class ForbiddenError extends Error {
  readonly status = 403;
  constructor(message = "Forbidden") {
    super(message);
  }
}

export class ConflictError extends Error {
  readonly status = 409;
  constructor(message = "Conflict") {
    super(message);
  }
}
