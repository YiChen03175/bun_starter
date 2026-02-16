import { describe, expect, it } from "bun:test";
import {
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
} from "@/server/errors/http";

describe("UnauthorizedError", () => {
  it("should have default message and 401 status when constructed without arguments", () => {
    // Given an UnauthorizedError is created without arguments
    const err = new UnauthorizedError();

    // Then it should use the default "Unauthorized" message and 401 status
    expect(err.message).toBe("Unauthorized");
    expect(err.status).toBe(401);
  });

  it("should use custom message when provided", () => {
    // Given an UnauthorizedError is created with a custom message
    const err = new UnauthorizedError("Token expired");

    // Then it should use the provided message while keeping 401 status
    expect(err.message).toBe("Token expired");
    expect(err.status).toBe(401);
  });

  it("should be an instance of Error", () => {
    // Given an UnauthorizedError is created
    const err = new UnauthorizedError();

    // Then it should inherit from the base Error class
    expect(err).toBeInstanceOf(Error);
  });
});

describe("ForbiddenError", () => {
  it("should have default message and 403 status when constructed without arguments", () => {
    // Given a ForbiddenError is created without arguments
    const err = new ForbiddenError();

    // Then it should use the default "Forbidden" message and 403 status
    expect(err.message).toBe("Forbidden");
    expect(err.status).toBe(403);
  });

  it("should use custom message when provided", () => {
    // Given a ForbiddenError is created with a custom message
    const err = new ForbiddenError("Admin only");

    // Then it should use the provided message while keeping 403 status
    expect(err.message).toBe("Admin only");
    expect(err.status).toBe(403);
  });

  it("should be an instance of Error", () => {
    // Given a ForbiddenError is created
    const err = new ForbiddenError();

    // Then it should inherit from the base Error class
    expect(err).toBeInstanceOf(Error);
  });
});

describe("ConflictError", () => {
  it("should have default message and 409 status when constructed without arguments", () => {
    // Given a ConflictError is created without arguments
    const err = new ConflictError();

    // Then it should use the default "Conflict" message and 409 status
    expect(err.message).toBe("Conflict");
    expect(err.status).toBe(409);
  });

  it("should use custom message when provided", () => {
    // Given a ConflictError is created with a custom message
    const err = new ConflictError("Email already exists");

    // Then it should use the provided message while keeping 409 status
    expect(err.message).toBe("Email already exists");
    expect(err.status).toBe(409);
  });

  it("should be an instance of Error", () => {
    // Given a ConflictError is created
    const err = new ConflictError();

    // Then it should inherit from the base Error class
    expect(err).toBeInstanceOf(Error);
  });
});
