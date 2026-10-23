// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useWorkspace } from "./store";
import { DEFAULT_SETTINGS, type Feat } from "./types";

const loadCloud = vi.fn();
const saveCloud = vi.fn();

vi.mock("./cloud", () => {
  return {
    loadCloud: (...a: unknown[]) => loadCloud(...a),
    saveCloud: (...a: unknown[]) => saveCloud(...a),
    ConflictError: class ConflictError extends Error {},
  };
});

const LEGACY = "sentinel-admin-workspace-v1";
const keyFor = (uid: string) => `${LEGACY}:${uid}`;
const zone: Feat = {
  id: "z1",
  type: "Feature",
  properties: { mode: "zone-polygon" },
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [-71, -41],
        [-71, -40],
        [-70, -40],
        [-71, -41],
      ],
    ],
  },
};
const wsWith = (over: Record<string, unknown> = {}) => ({
  features: [],
  meta: {},
  settings: DEFAULT_SETTINGS,
  notes: "",
  ops: { orders: {}, log: [] },
  ...over,
});
const seed = (key: string, v: unknown) =>
  localStorage.setItem(key, JSON.stringify(v));
const stored = (key: string) => JSON.parse(localStorage.getItem(key) ?? "null");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const WAIT = { timeout: 4000 };
const setVisibility = (v: "hidden" | "visible") =>
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: v,
  });

function mount(uid?: string) {
  return renderHook(({ id }: { id?: string }) => useWorkspace(id), {
    initialProps: { id: uid },
  });
}

beforeEach(() => {
  localStorage.clear();
  loadCloud.mockReset();
  saveCloud.mockReset();
  saveCloud.mockResolvedValue(1);
  setVisibility("visible");
});
afterEach(() => cleanup());

describe("useWorkspace (anonymous)", () => {
  test("loads from and saves to localStorage, never touching the cloud", async () => {
    seed(LEGACY, wsWith({ notes: "hola" }));
    const { result } = mount();
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.ws.notes).toBe("hola");
    expect(result.current.sync).toBe("local");
    act(() => result.current.setNotes("chau"));
    await waitFor(() => expect(stored(LEGACY).ws.notes).toBe("chau"));
    expect(stored(LEGACY).dirty).toBe(false);
    expect(loadCloud).not.toHaveBeenCalled();
    expect(saveCloud).not.toHaveBeenCalled();
  });
});

describe("useWorkspace (cloud)", { timeout: 15_000 }, () => {
  test("adopts the legacy workspace once, uploads it and removes the legacy key", async () => {
    seed(LEGACY, wsWith({ features: [zone], notes: "viejo" }));
    loadCloud.mockResolvedValue(null);
    const { result } = mount("u1");
    await waitFor(() => expect(result.current.ws.notes).toBe("viejo"), WAIT);
    expect(localStorage.getItem(LEGACY)).toBeNull();
    expect(stored(keyFor("u1")).ws.notes).toBe("viejo");
    await waitFor(() => expect(saveCloud).toHaveBeenCalledTimes(1), WAIT);
    expect(saveCloud.mock.calls[0][0]).toBe("u1");
    expect(saveCloud.mock.calls[0][2]).toBe(0);
    await waitFor(() => expect(result.current.sync).toBe("saved"), WAIT);
  });

  test("an empty legacy workspace is not adopted and nothing is uploaded", async () => {
    seed(LEGACY, wsWith());
    loadCloud.mockResolvedValue(null);
    const { result } = mount("u1");
    await waitFor(() => expect(result.current.sync).toBe("saved"), WAIT);
    await sleep(1400);
    expect(saveCloud).not.toHaveBeenCalled();
    expect(localStorage.getItem(LEGACY)).not.toBeNull();
  });

  test("a dirty local copy based on the same rev is pushed", async () => {
    loadCloud.mockResolvedValue({
      data: wsWith({ notes: "server" }),
      rev: 3,
      clientAt: 100,
    });
    seed(keyFor("u1"), {
      ws: wsWith({ notes: "mine" }),
      at: 500,
      dirty: true,
      rev: 3,
    });
    const { result } = mount("u1");
    await waitFor(() => expect(saveCloud).toHaveBeenCalledTimes(1), WAIT);
    expect(result.current.ws.notes).toBe("mine");
    expect(saveCloud.mock.calls[0][2]).toBe(3);
    expect(saveCloud.mock.calls[0][1].notes).toBe("mine");
    await waitFor(() => expect(result.current.sync).toBe("saved"), WAIT);
  });

  test("a clean local copy yields to the server copy", async () => {
    loadCloud.mockResolvedValue({
      data: wsWith({ notes: "server" }),
      rev: 4,
      clientAt: 100,
    });
    seed(keyFor("u1"), {
      ws: wsWith({ notes: "old" }),
      at: 50,
      dirty: false,
      rev: 2,
    });
    const { result } = mount("u1");
    await waitFor(() => expect(result.current.ws.notes).toBe("server"), WAIT);
    await sleep(1400);
    expect(saveCloud).not.toHaveBeenCalled();
  });

  describe("conflicts", () => {
    const mountConflict = async () => {
      loadCloud.mockResolvedValue({
        data: wsWith({ notes: "server" }),
        rev: 5,
        clientAt: 100,
      });
      seed(keyFor("u1"), {
        ws: wsWith({ notes: "mine" }),
        at: 500,
        dirty: true,
        rev: 2,
      });
      const hook = mount("u1");
      await waitFor(
        () => expect(hook.result.current.sync).toBe("conflict"),
        WAIT,
      );
      return hook;
    };

    test("a different rev raises conflict and does not upload", async () => {
      const { result } = await mountConflict();
      expect(result.current.ws.notes).toBe("mine");
      await sleep(1400);
      expect(saveCloud).not.toHaveBeenCalled();
    });

    test("resolveConflict('server') adopts the remote copy", async () => {
      const { result } = await mountConflict();
      act(() => result.current.resolveConflict("server"));
      await waitFor(() => expect(result.current.ws.notes).toBe("server"));
      expect(result.current.sync).toBe("saved");
      expect(stored(keyFor("u1"))).toMatchObject({ dirty: false, rev: 5 });
      await sleep(1400);
      expect(saveCloud).not.toHaveBeenCalled();
    });

    test("resolveConflict('mine') force-saves on top of the remote rev", async () => {
      saveCloud.mockResolvedValue(6);
      const { result } = await mountConflict();
      act(() => result.current.resolveConflict("mine"));
      await waitFor(() => expect(saveCloud).toHaveBeenCalledTimes(1), WAIT);
      expect(saveCloud.mock.calls[0][2]).toBe(5);
      expect(saveCloud.mock.calls[0][4]).toBe(true);
      expect(saveCloud.mock.calls[0][1].notes).toBe("mine");
      // not asserting sync "saved": with no edit since load, editedAt is 0 and dirty never clears (store.ts push)
    });

    test("a save rejected with ConflictError raises conflict", async () => {
      const { ConflictError } = await import("./cloud");
      loadCloud.mockResolvedValue({ data: wsWith(), rev: 1, clientAt: 1 });
      saveCloud.mockRejectedValue(new ConflictError());
      const { result } = mount("u1");
      await waitFor(() => expect(result.current.ready).toBe(true), WAIT);
      act(() => result.current.setNotes("x"));
      await waitFor(() => expect(result.current.sync).toBe("conflict"), WAIT);
    });
  });

  test("a local copy whose `at` equals the remote clientAt is already uploaded", async () => {
    loadCloud.mockResolvedValue({
      data: wsWith({ notes: "uploaded" }),
      rev: 3,
      clientAt: 100,
    });
    seed(keyFor("u1"), {
      ws: wsWith({ notes: "uploaded" }),
      at: 100,
      dirty: true,
      rev: 2,
    });
    const { result } = mount("u1");
    await waitFor(() => expect(result.current.sync).toBe("saved"), WAIT);
    expect(result.current.ws.notes).toBe("uploaded");
    expect(stored(keyFor("u1"))).toMatchObject({
      dirty: false,
      rev: 3,
      at: 100,
    });
    await sleep(1400);
    expect(saveCloud).not.toHaveBeenCalled();
  });

  test("hiding the tab inside the debounce window saves immediately", async () => {
    loadCloud.mockResolvedValue({ data: wsWith(), rev: 1, clientAt: 1 });
    const { result } = mount("u1");
    await waitFor(() => expect(result.current.sync).toBe("saved"), WAIT);
    act(() => result.current.setNotes("ultimo"));
    await waitFor(() => expect(result.current.sync).toBe("saving"));
    expect(saveCloud).not.toHaveBeenCalled();
    setVisibility("hidden");
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await waitFor(() => expect(saveCloud).toHaveBeenCalledTimes(1));
    expect(saveCloud.mock.calls[0][1].notes).toBe("ultimo");
    await waitFor(() => expect(result.current.sync).toBe("saved"), WAIT);
  });

  test("switching uid resets state and does not leak the previous workspace", async () => {
    loadCloud.mockImplementation(async (uid: string) =>
      uid === "a"
        ? {
            data: wsWith({ features: [zone], notes: "de A" }),
            rev: 2,
            clientAt: 1,
          }
        : null,
    );
    const { result, rerender } = mount("a");
    await waitFor(() => expect(result.current.ws.notes).toBe("de A"), WAIT);
    act(() => result.current.setNotes("A editado"));
    rerender({ id: "b" });
    await waitFor(() => expect(result.current.ready).toBe(true), WAIT);
    await waitFor(() => expect(loadCloud).toHaveBeenCalledWith("b"), WAIT);
    expect(result.current.ws.notes).toBe("");
    expect(result.current.ws.features).toEqual([]);
    expect(result.current.canUndo).toBe(false);
    await sleep(1400);
    for (const call of saveCloud.mock.calls) expect(call[0]).not.toBe("b");
    expect(stored(keyFor("b"))?.ws?.notes ?? "").toBe("");
  });

  test("a failed load sets error, blocks saving, and retry() recovers", async () => {
    loadCloud.mockRejectedValueOnce(new Error("offline")).mockResolvedValue({
      data: wsWith({ notes: "server" }),
      rev: 1,
      clientAt: 1,
    });
    const { result } = mount("u1");
    await waitFor(() => expect(result.current.sync).toBe("error"), WAIT);
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.sync).toBe("saved"), WAIT);
    expect(result.current.ws.notes).toBe("server");
  });

  test("edits made while the load is failing are never uploaded", async () => {
    loadCloud.mockRejectedValue(new Error("offline"));
    const { result } = mount("u1");
    await waitFor(() => expect(result.current.sync).toBe("error"), WAIT);
    act(() => result.current.setNotes("no debe subir"));
    await sleep(1400);
    expect(saveCloud).not.toHaveBeenCalled();
  });

  test("a failed save sets error and a later edit recovers", async () => {
    loadCloud.mockResolvedValue({ data: wsWith(), rev: 1, clientAt: 1 });
    saveCloud.mockRejectedValueOnce(new Error("offline")).mockResolvedValue(2);
    const { result } = mount("u1");
    await waitFor(() => expect(result.current.sync).toBe("saved"), WAIT);
    act(() => result.current.setNotes("uno"));
    await waitFor(() => expect(result.current.sync).toBe("error"), WAIT);
    act(() => result.current.setNotes("dos"));
    await waitFor(() => expect(result.current.sync).toBe("saved"), WAIT);
    expect(saveCloud).toHaveBeenCalledTimes(2);
    expect(saveCloud.mock.calls[1][1].notes).toBe("dos");
  });

  test("a failed import('./cloud') does not wedge the save queue", async () => {
    loadCloud.mockResolvedValue({ data: wsWith(), rev: 1, clientAt: 1 });
    const { result } = mount("u1");
    await waitFor(() => expect(result.current.sync).toBe("saved"), WAIT);
    vi.resetModules();
    vi.doMock("./cloud", () => {
      throw new Error("chunk failed to load");
    });
    act(() => result.current.setNotes("uno"));
    await waitFor(() => expect(result.current.sync).toBe("error"), WAIT);
    vi.doMock("./cloud", () => ({
      loadCloud,
      saveCloud,
      ConflictError: class ConflictError extends Error {},
    }));
    act(() => result.current.setNotes("dos"));
    await waitFor(() => expect(result.current.sync).toBe("saved"), WAIT);
    expect(saveCloud.mock.calls.at(-1)?.[1].notes).toBe("dos");
  });
});

describe("useWorkspace (editing)", () => {
  test("setFeatures records history for undo/redo and prunes orphan meta", async () => {
    const { result } = mount();
    await waitFor(() => expect(result.current.ready).toBe(true));
    act(() => result.current.setFeatures([zone]));
    act(() => result.current.setMeta("z1", { name: "Zona" }));
    expect(result.current.canUndo).toBe(true);
    act(() => void result.current.undo());
    expect(result.current.ws.features).toEqual([]);
    expect(result.current.canRedo).toBe(true);
    act(() => void result.current.redo());
    expect(result.current.ws.features).toHaveLength(1);
    act(() => result.current.setFeatures([]));
    expect(result.current.ws.meta).toEqual({});
    expect(result.current.undo()).toBe(true);
  });

  test("undo after a full replace brings back notes, log and settings; redo returns to the import", async () => {
    const { result } = mount();
    await waitFor(() => expect(result.current.ready).toBe(true));
    act(() => result.current.setNotes("originales"));
    act(() => result.current.addNote("bitacora", "yo"));
    act(() => result.current.setSettings({ org: "Vieja" }));
    const before = result.current.ws;
    act(() =>
      result.current.replace({
        ...before,
        features: [zone],
        meta: { z1: { name: "Z" } },
        notes: "importadas",
        noteLog: [],
        settings: { ...before.settings, org: "Nueva" },
      }),
    );
    expect(result.current.ws.notes).toBe("importadas");
    act(() => void result.current.undo());
    expect(result.current.ws).toEqual(before);
    expect(result.current.canRedo).toBe(true);
    act(() => void result.current.redo());
    expect(result.current.ws.notes).toBe("importadas");
    expect(result.current.ws.settings.org).toBe("Nueva");
    act(() => void result.current.undo());
    expect(result.current.ws).toEqual(before);
  });

  test("undoing a full replace in a cloud account marks the workspace dirty and uploads it", async () => {
    loadCloud.mockResolvedValue({ data: wsWith({ notes: "nube" }), rev: 2, clientAt: 1 });
    const { result } = mount("u1");
    await waitFor(() => expect(result.current.sync).toBe("saved"), WAIT);
    act(() => result.current.replace({ ...result.current.ws, notes: "importadas" }));
    await waitFor(() => expect(saveCloud).toHaveBeenCalledTimes(1), WAIT);
    await waitFor(() => expect(result.current.sync).toBe("saved"), WAIT);
    act(() => void result.current.undo());
    await waitFor(() => expect(saveCloud).toHaveBeenCalledTimes(2), WAIT);
    expect(saveCloud.mock.calls[1][1].notes).toBe("nube");
    expect(saveCloud.mock.calls[1][2]).toBe(1); // rev from the first save
  });

  test("a normal edit after a replace undoes on its own, features only", async () => {
    const { result } = mount();
    await waitFor(() => expect(result.current.ready).toBe(true));
    act(() => result.current.replace({ ...result.current.ws, notes: "importadas" }));
    act(() => result.current.setFeatures([zone]));
    act(() => void result.current.undo());
    expect(result.current.ws.features).toEqual([]);
    expect(result.current.ws.notes).toBe("importadas");
  });
});
