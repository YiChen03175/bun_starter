// Save native Bun globals before happy-dom overwrites them.
// Server tests (Elysia .handle()) need native Request for proper body parsing.
globalThis.__BunRequest = globalThis.Request;

import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();
