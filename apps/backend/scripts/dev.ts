import { createServer } from "net";

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
