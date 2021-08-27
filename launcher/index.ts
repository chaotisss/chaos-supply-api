import Cloudworker from "@dollarshaveclub/cloudworker";
import workerCode from "../dist/worker.production.js";

class MockKv {
  storage: Map<string, string>;

  constructor() {
    this.storage = new Map<string, string>();
  }

  get(key: string): string | null {
    return this.storage.get(key) ?? null;
  }

  put(key: string, value: string) {
    this.storage.set(key, value);
  }
}

const bindings: any = {};

const envVars: string[] = [];
const kvNamespaces: string[] = [];

for (const envVar of envVars) {
  if (!process.env[envVar]) {
    console.error(`Environment variable "${envVar}" not set`);
    process.exit(1);
  }

  bindings[envVar] = process.env[envVar];
}

for (const kvNamespace of kvNamespaces) {
  bindings[kvNamespace] = new MockKv();
}

const port: number = process.env.PORT ? parseInt(process.env.PORT) : 80;
if (isNaN(port)) {
  throw new Error("Invalid port number");
}

console.log(`Listening on http://0.0.0.0:${port}`);

new Cloudworker(workerCode, {
  bindings: bindings,
}).listen(port);
