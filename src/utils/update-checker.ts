/**
 * @nemesis-js/cli - Update checker
 *
 * Checks npm for a newer version of `@nemesis-js/cli` at most once every
 * 24 hours. The last-check timestamp and latest version are persisted to
 * `~/.config/nemesis/update-check.json` so we never block the CLI for
 * network I/O.
 *
 * Usage (non-blocking):
 *   checkForUpdate().catch(() => {});  // fire-and-forget
 *
 * Usage (blocking, e.g. `nemesis update` command):
 *   const info = await checkForUpdate({ force: true });
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UpdateInfo {
  /** The version currently installed. */
  currentVersion: string;
  /** The latest version available on npm. */
  latestVersion: string;
  /** True when latestVersion is strictly newer than currentVersion. */
  hasUpdate: boolean;
}

interface CacheEntry {
  checkedAt: number;   // Unix ms timestamp
  latestVersion: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PACKAGE_NAME   = '@nemesis-js/cli';
const CACHE_DIR      = join(homedir(), '.config', 'nemesis');
const CACHE_FILE     = join(CACHE_DIR, 'update-check.json');
const CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in ms
const REGISTRY_URL   = `https://registry.npmjs.org/${PACKAGE_NAME}/latest`;

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Check npm for a newer version of the CLI.
 *
 * @param opts.force  Bypass the 24h cache and always hit npm.
 * @returns UpdateInfo, or null if the check failed (network error, etc.).
 */
export async function checkForUpdate(
  opts: { force?: boolean } = {},
): Promise<UpdateInfo | null> {
  try {
    const currentVersion = await readCurrentVersion();
    const latestVersion  = await fetchLatestVersion(opts.force ?? false);

    if (!latestVersion) return null;

    return {
      currentVersion,
      latestVersion,
      hasUpdate: isNewer(latestVersion, currentVersion),
    };
  } catch {
    return null;
  }
}

// ── Private helpers ───────────────────────────────────────────────────────────

/** Read the version from the CLI's own package.json. */
async function readCurrentVersion(): Promise<string> {
  const pkgPath = new URL('../../package.json', import.meta.url).pathname;
  const raw = await readFile(pkgPath, 'utf8');
  return (JSON.parse(raw) as { version: string }).version;
}

/**
 * Return the latest version from npm, using a 24h disk cache to
 * avoid hitting the network on every command invocation.
 */
async function fetchLatestVersion(force: boolean): Promise<string | null> {
  // Check cache first (unless forced)
  if (!force) {
    const cached = await readCache();
    if (cached && Date.now() - cached.checkedAt < CHECK_INTERVAL) {
      return cached.latestVersion;
    }
  }

  // Hit npm registry
  try {
    const res = await fetch(REGISTRY_URL, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5_000),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as { version: string };
    const latest = data.version;

    // Persist to cache
    await writeCache({ checkedAt: Date.now(), latestVersion: latest });

    return latest;
  } catch {
    return null;
  }
}

async function readCache(): Promise<CacheEntry | null> {
  try {
    const raw = await readFile(CACHE_FILE, 'utf8');
    return JSON.parse(raw) as CacheEntry;
  } catch {
    return null;
  }
}

async function writeCache(entry: CacheEntry): Promise<void> {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(CACHE_FILE, JSON.stringify(entry, null, 2), 'utf8');
  } catch {
    // Best-effort — silently ignore write errors
  }
}

/**
 * Simple semver comparison: returns true if `a` is strictly newer than `b`.
 * Handles standard "MAJOR.MINOR.PATCH" strings; ignores pre-release tags.
 */
function isNewer(a: string, b: string): boolean {
  const parse = (v: string) => v.split('-')[0]!.split('.').map(Number);
  const [aMaj = 0, aMin = 0, aPat = 0] = parse(a);
  const [bMaj = 0, bMin = 0, bPat = 0] = parse(b);

  if (aMaj !== bMaj) return aMaj > bMaj;
  if (aMin !== bMin) return aMin > bMin;
  return aPat > bPat;
}
