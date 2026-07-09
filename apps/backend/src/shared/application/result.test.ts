import { describe, it, expect } from "bun:test";
import { Result } from "./result";

describe("Result.ok / Result.fail", () => {
  it("should create a success result carrying the value", () => {
    const result = Result.ok<number>(42);
    expect(result.isSuccess).toBe(true);
    expect(result.isFailure).toBe(false);
    expect(result.value).toBe(42);
  });

  it("should create a failure result carrying the error", () => {
    const result = Result.fail<number, string>("NOT_FOUND");
    expect(result.isSuccess).toBe(false);
    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("NOT_FOUND");
  });
});

describe("Result value/error guards", () => {
  it("should throw when reading .value on a failed result", () => {
    const result = Result.fail<number, string>("BOOM");
    expect(() => result.value).toThrow("Cannot get value from failed result");
  });

  it("should throw when reading .error on a successful result", () => {
    const result = Result.ok<number>(1);
    expect(() => result.error).toThrow("Cannot get error from successful result");
  });
});

describe("Result.map", () => {
  it("should transform the value on success", () => {
    const result = Result.ok<number>(2).map((n) => n * 10);
    expect(result.isSuccess).toBe(true);
    expect(result.value).toBe(20);
  });

  it("should pass the error through unchanged on failure, without calling the mapper", () => {
    let called = false;
    const result = Result.fail<number, string>("ERR").map((n) => {
      called = true;
      return n * 10;
    });
    expect(called).toBe(false);
    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("ERR");
  });
});

describe("Result.flatMap", () => {
  it("should chain into another Result on success", () => {
    const result = Result.ok<number>(2).flatMap((n) => Result.ok(n + 1));
    expect(result.isSuccess).toBe(true);
    expect(result.value).toBe(3);
  });

  it("should short-circuit with the original error on failure", () => {
    const result = Result.fail<number, string>("ERR").flatMap((n) =>
      Result.ok(n + 1),
    );
    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("ERR");
  });
});

describe("Result.getOrElse", () => {
  it("should return the value on success", () => {
    expect(Result.ok<number>(5).getOrElse(0)).toBe(5);
  });

  it("should return the default on failure", () => {
    expect(Result.fail<number, string>("ERR").getOrElse(0)).toBe(0);
  });
});
