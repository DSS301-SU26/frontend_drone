import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

let backendRoot = path.resolve(frontendRoot, "../BE/agricultural-drone-scheduler");
try {
  await access(backendRoot);
} catch {
  backendRoot = path.resolve(frontendRoot, "../../BE_DSS/agricultural-drone-scheduler");
}

const uvicorn = process.platform === "win32"
  ? path.join(backendRoot, ".venv/Scripts/uvicorn.exe")
  : path.join(backendRoot, ".venv/bin/uvicorn");
const vite = process.platform === "win32"
  ? path.join(frontendRoot, "node_modules/.bin/vite.cmd")
  : path.join(frontendRoot, "node_modules/.bin/vite");
const healthUrl = "http://127.0.0.1:8000/api/health";
const viteArgs = process.argv.slice(2);

let backend;
let frontend;
let shuttingDown = false;

async function isBackendReady() {
  try {
    const response = await fetch(healthUrl);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForBackend() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (await isBackendReady()) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Backend did not become ready at ${healthUrl}`);
}

function stop(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  frontend?.kill("SIGTERM");
  backend?.kill("SIGTERM");
  process.exit(exitCode);
}

async function start() {
  await access(vite, constants.X_OK);

  if (await isBackendReady()) {
    console.log("[dev] Reusing Agricultural Drone Scheduler API on port 8000.");
  } else {
    await access(uvicorn, constants.X_OK);
    console.log("[dev] Starting Agricultural Drone Scheduler API on port 8000.");
    backend = spawn(uvicorn, ["src.api:app", "--reload", "--port", "8000"], {
      cwd: backendRoot,
      stdio: "inherit",
    });
    backend.once("exit", (code) => {
      if (!shuttingDown) {
        console.error(`[dev] Backend stopped unexpectedly with code ${code ?? 1}.`);
        stop(code ?? 1);
      }
    });
    await waitForBackend();
  }

  console.log("[dev] Starting Vite frontend.");
  frontend = spawn(vite, viteArgs, {
    cwd: frontendRoot,
    stdio: "inherit",
    shell: process.platform === "win32" ? true : false,
  });
  frontend.once("exit", (code) => stop(code ?? 0));
}

process.once("SIGINT", () => stop());
process.once("SIGTERM", () => stop());

start().catch((error) => {
  console.error(`[dev] ${error.message}`);
  stop(1);
});
