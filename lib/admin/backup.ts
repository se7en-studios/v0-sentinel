import { parseWorkspace } from "./store";
import type { Workspace } from "./types";

export const BACKUP_APP = "sentinel-workspace";
export const BACKUP_VERSION = 1;
export const MAX_BACKUP_BYTES = 5_000_000;

/** The whole workspace in one JSON document, tagged so an import can tell it from a plain GeoJSON. */
export const buildBackup = (ws: Workspace, now = new Date()): string =>
  JSON.stringify(
    {
      app: BACKUP_APP,
      version: BACKUP_VERSION,
      exportedAt: now.toISOString(),
      workspace: ws,
    },
    null,
    2,
  );

/** Reads a backup file; throws when it is not one (the caller shows a message). */
export function readBackup(text: string): Workspace {
  if (text.length > MAX_BACKUP_BYTES) throw new Error("too-big");
  const raw: unknown = JSON.parse(text);
  const doc = raw as { app?: unknown; version?: unknown; workspace?: unknown };
  if (
    !doc ||
    doc.app !== BACKUP_APP ||
    typeof doc.version !== "number" ||
    typeof doc.workspace !== "object" ||
    doc.workspace === null
  )
    throw new Error("not-a-backup");
  return parseWorkspace(doc.workspace);
}
