import { config as dotenvConfig } from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { getApiRoot, getWorkspaceRoot } from "./runtime-paths";

let runtimeEnvLoaded = false;

export function getEnvFileCandidates() {
  const candidates = [
    path.join(getApiRoot(), ".env"),
    path.join(getWorkspaceRoot(), ".env"),
  ];

  return candidates.filter(
    (candidate, index) =>
      candidates.indexOf(candidate) === index && fs.existsSync(candidate),
  );
}

export function loadRuntimeEnv() {
  if (runtimeEnvLoaded) {
    return getEnvFileCandidates();
  }

  const envFiles = getEnvFileCandidates();

  for (const envFile of envFiles) {
    dotenvConfig({ path: envFile, override: false });
  }

  runtimeEnvLoaded = true;
  return envFiles;
}
