const NativeRequest = globalThis.__BunRequest;
const BASE_URL = "http://localhost";

type HandleFn = { handle: (req: Request) => Response | Promise<Response> };

export function createTestClient(app: HandleFn) {
  function request(path: string, init?: RequestInit) {
    return app.handle(new NativeRequest(`${BASE_URL}${path}`, init));
  }

  function json(path: string, body: unknown, method = "POST") {
    return request(path, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  return { request, json };
}
