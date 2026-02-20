import { describe, expect, it } from "bun:test";
import { diffWords } from "@/lib/diff-words";

describe("diffWords", () => {
  it("should return all 'keep' segments for identical strings", () => {
    const result = diffWords("hello world", "hello world");
    expect(result).toEqual([{ type: "keep", text: "hello world" }]);
  });

  it("should return all 'remove' then 'add' for completely different strings", () => {
    const result = diffWords("foo bar", "baz qux");
    expect(result).toEqual([
      { type: "remove", text: "foo bar" },
      { type: "add", text: "baz qux" },
    ]);
  });

  it("should return all 'add' when old string is empty", () => {
    const result = diffWords("", "hello world");
    expect(result).toEqual([{ type: "add", text: "hello world" }]);
  });

  it("should return all 'remove' when new string is empty", () => {
    const result = diffWords("hello world", "");
    expect(result).toEqual([{ type: "remove", text: "hello world" }]);
  });

  it("should return empty array when both strings are empty", () => {
    const result = diffWords("", "");
    expect(result).toEqual([]);
  });

  it("should detect a single word change in the middle of a sentence", () => {
    const result = diffWords("the quick brown fox", "the slow brown fox");
    expect(result).toEqual([
      { type: "keep", text: "the" },
      { type: "remove", text: "quick" },
      { type: "add", text: "slow" },
      { type: "keep", text: "brown fox" },
    ]);
  });

  it("should detect multiple scattered changes", () => {
    const result = diffWords("a b c d e", "a x c y e");
    expect(result).toEqual([
      { type: "keep", text: "a" },
      { type: "remove", text: "b" },
      { type: "add", text: "x" },
      { type: "keep", text: "c" },
      { type: "remove", text: "d" },
      { type: "add", text: "y" },
      { type: "keep", text: "e" },
    ]);
  });

  it("should detect a word added at the beginning", () => {
    const result = diffWords("world", "hello world");
    expect(result).toEqual([
      { type: "add", text: "hello" },
      { type: "keep", text: "world" },
    ]);
  });

  it("should detect a word added at the end", () => {
    const result = diffWords("hello", "hello world");
    expect(result).toEqual([
      { type: "keep", text: "hello" },
      { type: "add", text: "world" },
    ]);
  });

  it("should detect a word removed from the beginning", () => {
    const result = diffWords("hello world", "world");
    expect(result).toEqual([
      { type: "remove", text: "hello" },
      { type: "keep", text: "world" },
    ]);
  });

  it("should detect a word removed from the end", () => {
    const result = diffWords("hello world", "hello");
    expect(result).toEqual([
      { type: "keep", text: "hello" },
      { type: "remove", text: "world" },
    ]);
  });

  it("should treat punctuation attached to words as part of the word", () => {
    const result = diffWords("hello, world!", "hello, earth!");
    expect(result).toEqual([
      { type: "keep", text: "hello," },
      { type: "remove", text: "world!" },
      { type: "add", text: "earth!" },
    ]);
  });

  it("should merge consecutive segments of the same type", () => {
    const result = diffWords("a b c", "d e f");
    expect(result).toEqual([
      { type: "remove", text: "a b c" },
      { type: "add", text: "d e f" },
    ]);
  });

  it("should handle extra whitespace by normalizing to single spaces", () => {
    const result = diffWords("hello   world", "hello world");
    expect(result).toEqual([{ type: "keep", text: "hello world" }]);
  });
});
