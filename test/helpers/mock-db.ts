import { mock } from "bun:test";

let queryResult: unknown = [];

export function setQueryResult(result: unknown) {
  queryResult = result;
}

function drizzleChain() {
  const handler: ProxyHandler<() => void> = {
    get(_, prop) {
      if (prop === "then") {
        const p = Promise.resolve(queryResult);
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
