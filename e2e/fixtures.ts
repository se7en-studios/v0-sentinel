import { expect, test as base, type BrowserContext, type Page } from "@playwright/test";

export { expect };
export type { Page };

export const WORKSPACE_KEY = "sentinel-admin-workspace-v1";

/** Marks the first-run question as answered, but only when nothing is saved yet (so reloads keep what a test stored). */
export const skipFirstRun = (ctx: BrowserContext | Page) =>
  ctx.addInitScript((key) => {
    try {
      if (localStorage.getItem(key) === null) localStorage.setItem(key, JSON.stringify({ settings: { onboarded: true } }));
    } catch {
      /* storage blocked: the test sees the first-run screen */
    }
  }, WORKSPACE_KEY);

/** `test` for everything except the first-run flow itself: the panel opens straight on its content. */
export const test = base.extend({
  context: async ({ context }, run) => {
    await skipFirstRun(context);
    await run(context);
  },
});

/** The plain `test`, for specs that need the first-run question. */
export const firstRunTest = base;
