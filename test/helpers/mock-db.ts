import { mock } from "bun:test";

let queryResult: unknown = [];
let queryResultFn: (() => unknown) | null = null;

export function setQueryResult(result: unknown) {
  queryResult = result;
  queryResultFn = null;
}

export function setQueryResultFn(fn: (() => unknown) | null) {
  queryResultFn = fn;
}

function drizzleChain() {
  const handler: ProxyHandler<() => void> = {
    get(_, prop) {
      if (prop === "then") {
        const value = queryResultFn ? queryResultFn() : queryResult;
        const p = Promise.resolve(value);
        return p.then.bind(p);
      }
      return new Proxy(() => {}, handler);
    },
    apply() {
      return new Proxy(() => {}, handler);
    },
  };
  return new Proxy(() => {}, handler);
}

mock.module("@/server/db", () => ({
  db: new Proxy({}, { get: () => () => drizzleChain() }),
}));
