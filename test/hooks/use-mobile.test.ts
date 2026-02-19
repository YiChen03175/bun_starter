// Infrastructure: useIsMobile is a Shadcn sidebar dependency — no feature spec applies.
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { act, renderHook } from "@testing-library/react";

import { useIsMobile } from "@/hooks/use-mobile";

describe("useIsMobile", () => {
  // Detects whether the viewport is below the mobile breakpoint (768px)

  let listeners: Array<() => void>;
  let originalMatchMedia: typeof window.matchMedia;
  let originalInnerWidth: number;

  beforeEach(() => {
    listeners = [];
    originalMatchMedia = window.matchMedia;
    originalInnerWidth = window.innerWidth;

    window.matchMedia = () =>
      ({
        addEventListener: (_event: string, handler: () => void) => {
          listeners.push(handler);
        },
        removeEventListener: (_event: string, _handler: () => void) => {},
      }) as unknown as MediaQueryList;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    Object.defineProperty(window, "innerWidth", {
      value: originalInnerWidth,
      writable: true,
      configurable: true,
    });
  });

  function setWindowWidth(width: number) {
    Object.defineProperty(window, "innerWidth", {
      value: width,
      writable: true,
      configurable: true,
    });
  }

  it("should return true when viewport is below 768px", () => {
    // Given the viewport width is 500px (below mobile breakpoint)
    setWindowWidth(500);

    // When the hook renders
    const { result } = renderHook(() => useIsMobile());

    // Then it should report mobile
    expect(result.current).toBe(true);
  });

  it("should return false when viewport is at or above 768px", () => {
    // Given the viewport width is 1024px (above mobile breakpoint)
    setWindowWidth(1024);

    // When the hook renders
    const { result } = renderHook(() => useIsMobile());

    // Then it should report non-mobile
    expect(result.current).toBe(false);
  });

  it("should return false when viewport is exactly 768px", () => {
    // Given the viewport width is exactly at the breakpoint
    setWindowWidth(768);

    // When the hook renders
    const { result } = renderHook(() => useIsMobile());

    // Then it should report non-mobile (breakpoint is exclusive)
    expect(result.current).toBe(false);
  });

  it("should return true when the viewport resizes below the breakpoint", () => {
    // Given the viewport starts at desktop width
    setWindowWidth(1024);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    // When the viewport resizes below the breakpoint
    setWindowWidth(500);
    act(() => {
      for (const listener of listeners) listener();
    });

    // Then it should switch to mobile
    expect(result.current).toBe(true);
  });

  it("should return false when the viewport resizes above the breakpoint", () => {
    // Given the viewport starts at mobile width
    setWindowWidth(500);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);

    // When the viewport resizes above the breakpoint
    setWindowWidth(1024);
    act(() => {
      for (const listener of listeners) listener();
    });

    // Then it should switch to non-mobile
    expect(result.current).toBe(false);
  });
});
