import * as fs from "fs";
import * as path from "path";

function uniquePaths(paths: string[]) {
  return [...new Set(paths.map((value) => path.resolve(value)))];
}

function pathInside(basePath: string, targetPath: string) {
  const relative = path.relative(basePath, targetPath);
  return (
    relative !== "" &&
    !relative.startsWith("..") &&
    !path.isAbsolute(relative)
  );
}

export function getApiRoot() {
  const candidates = uniquePaths([
    process.cwd(),
    path.resolve(process.cwd(), "apps", "api"),
    path.resolve(process.cwd(), ".."),
  ]);

  for (const candidate of candidates) {
    if (
      fs.existsSync(path.join(candidate, "src")) &&
      fs.existsSync(path.join(candidate, "package.json"))
    ) {
      return candidate;
    }
  }

  return process.cwd();
}

export function getWorkspaceRoot() {
  const apiRoot = getApiRoot();
  const candidate = path.resolve(apiRoot, "..", "..");

  if (fs.existsSync(path.join(candidate, "apps"))) {
    return candidate;
  }

  return apiRoot;
}

export function getRecordingsDirectory() {
  const workspaceDir = path.join(getWorkspaceRoot(), "uploads", "recordings");
  const apiDir = path.join(getApiRoot(), "uploads", "recordings");

  if (fs.existsSync(workspaceDir) || !fs.existsSync(apiDir)) {
    return workspaceDir;
  }

  return apiDir;
}

export function ensureRecordingsDirectory() {
  const recordingsDir = getRecordingsDirectory();
  if (!fs.existsSync(recordingsDir)) {
    try {
      fs.mkdirSync(recordingsDir, { recursive: true });
    } catch (err: any) {
      console.warn(
        `[runtime-paths] Cannot create recordings directory (read-only FS?): ${err.message}`,
      );
    }
  }
  return recordingsDir;
}

export function toStoredAudioPath(absolutePath: string) {
  const normalizedAbsolutePath = path.resolve(absolutePath);
  const candidateRoots = uniquePaths([getWorkspaceRoot(), getApiRoot()]);

  for (const root of candidateRoots) {
    if (
      normalizedAbsolutePath === root ||
      pathInside(root, normalizedAbsolutePath)
    ) {
      return path.relative(root, normalizedAbsolutePath).split(path.sep).join("/");
    }
  }

  return path
    .join("uploads", "recordings", path.basename(normalizedAbsolutePath))
    .split(path.sep)
    .join("/");
}

function buildRelativeAudioCandidates(audioPath: string) {
  const normalized = audioPath
    .replace(/\//g, path.sep)
    .replace(/^(\.\\|\.\/)+/, "");
  const basename = path.basename(normalized);
  const candidates = [normalized, path.join("uploads", "recordings", basename)];

  if (!normalized.startsWith(path.join("uploads", path.sep))) {
    candidates.push(path.join("uploads", normalized));
  }

  if (!normalized.startsWith(path.join("recordings", path.sep))) {
    candidates.push(path.join("recordings", basename));
  }

  return [...new Set(candidates)];
}

export function resolveAudioPath(audioPath: string) {
  if (path.isAbsolute(audioPath)) {
    return audioPath;
  }

  const relativeCandidates = buildRelativeAudioCandidates(audioPath);
  const absoluteCandidates = uniquePaths(
    relativeCandidates.flatMap((candidate) => [
      path.join(getWorkspaceRoot(), candidate),
      path.join(getApiRoot(), candidate),
      path.join(process.cwd(), candidate),
    ]),
  );

  for (const candidate of absoluteCandidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return absoluteCandidates[0];
}

export function resolveApiPath(...segments: string[]) {
  return path.join(getApiRoot(), ...segments);
}
