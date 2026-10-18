import { spawn } from "node:child_process";
const children = [
  spawn(process.execPath, ["scripts/start-openclaw.mjs"], { stdio: "inherit" }),
  spawn(process.execPath, ["--env-file-if-exists=.env", "dist/server.js"], { stdio: "inherit" }),
];
let closing = false;
function stop(code) {
  if (closing) return;
  closing = true;
  for (const child of children) child.kill("SIGTERM");
  const force = setTimeout(() => { for (const child of children) child.kill("SIGKILL"); process.exit(code); }, 10000);
  force.unref();
  Promise.all(children.map(child => child.exitCode !== null ? Promise.resolve() : new Promise(resolve => child.once("exit", resolve)))).then(() => process.exit(code));
}
for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => stop(0));
for (const child of children) { child.on("error", () => stop(1)); child.on("exit", code => stop(code ?? 1)); }
