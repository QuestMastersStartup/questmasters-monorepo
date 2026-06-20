import { createServer } from "net";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT_ENV = resolve(import.meta.dir, "../../../.env");
const DEV_VARS = resolve(import.meta.dir, "../.dev.vars");

const BACKEND_KEYS = [
  "JWT_SECRET",
  "DM_MODEL_ENDPOINT_MAS",
  "DM_MODEL_ENDPOINT_MONOLITHIC",
  "DM_USE_RUNPOD",
  "RUNPOD_ENDPOINT_ID",
  "RUNPOD_API_KEY",
];

function syncDevVars() {
  if (!existsSync(ROOT_ENV)) return;
  const lines = readFileSync(ROOT_ENV, "utf-8").split("\n");
  const vars: string[] = ["# Auto-generado desde .env raíz — no editar manualmente"];
  for (const line of lines) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match && BACKEND_KEYS.includes(match[1])) {
      vars.push(`${match[1]}=${match[2]}`);
    }
  }
  if (vars.length > 1) {
    writeFileSync(DEV_VARS, vars.join("\n") + "\n");
    console.log("✔ .dev.vars sincronizado desde .env raíz");
  }
}

syncDevVars();

async function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen(port, "127.0.0.1");
  });
}

async function findFreePort(start: number): Promise<number> {
  for (let port = start; port < start + 20; port++) {
    if (await isPortFree(port)) return port;
  }
  throw new Error(`No se encontró un puerto libre a partir del ${start}`);
}

const BASE_PORT = 3000;
const port = await findFreePort(BASE_PORT);

if (port !== BASE_PORT) {
  console.warn(`\n⚠️  Puerto ${BASE_PORT} ocupado — usando puerto ${port}`);
  console.warn(
    `   Si usas el proxy del frontend, agrega VITE_API_URL=http://localhost:${port} a apps/frontend/.env.local\n`
  );
}

const proc = Bun.spawn(
  ["bun", "x", "wrangler", "dev", "--env", "preview", "--port", String(port)],
  { stdin: "inherit", stdout: "inherit", stderr: "inherit" }
);

process.exit(await proc.exited);
