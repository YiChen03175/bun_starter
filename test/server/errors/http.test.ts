import { describe, expect, test } from "bun:test";
import {
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
} from "@/server/errors/http";

describe("UnauthorizedError", () => {
  test("has default message and status 401", () => {
    const err = new UnauthorizedError();
    expect(err.message).toBe("Unauthorized");
    expect(err.status).toBe(401);
  });

  test("accepts custom message", () => {
    const err = new UnauthorizedError("Token expired");
    expect(err.message).toBe("Token expired");
    expect(err.status).toBe(401);
  });

  test("is instanceof Error", () => {
    expect(new UnauthorizedError()).toBeInstanceOf(Error);
  });
});

describe("ForbiddenError", () => {
  test("has default message and status 403", () => {
    const err = new ForbiddenError();
    expect(err.message).toBe("Forbidden");
    expect(err.status).toBe(403);
  });

  test("accepts custom message", () => {
    const err = new ForbiddenError("Admin only");
    expect(err.message).toBe("Admin only");
    expect(err.status).toBe(403);
  });

  test("is instanceof Error", () => {
    expect(new ForbiddenError()).toBeInstanceOf(Error);
  });
});

describe("ConflictError", () => {
  test("has default message and status 409", () => {
    const err = new ConflictError();
    expect(err.message).toBe("Conflict");
    expect(err.status).toBe(409);
  });

  test("accepts custom message", () => {
    const err = new ConflictError("Email already exists");
    expect(err.message).toBe("Email already exists");
    expect(err.status).toBe(409);
  });

  test("is instanceof Error", () => {
    expect(new ConflictError()).toBeInstanceOf(Error);
  });
});
