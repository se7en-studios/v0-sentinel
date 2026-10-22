import { beforeEach, describe, expect, test, vi } from "vitest";

const setDoc = vi.fn();
const getDoc = vi.fn();
const getDocs = vi.fn();
const deleteDoc = vi.fn();
vi.mock("firebase/firestore", () => ({
  collection: (_db: unknown, name: string) => ({ name }),
  doc: (_db: unknown, ...path: string[]) => ({ path: path.join("/") }),
  query: (c: unknown, w: unknown) => ({ c, w }),
  where: (...a: unknown[]) => a,
  setDoc: (...a: unknown[]) => setDoc(...a),
  getDoc: (...a: unknown[]) => getDoc(...a),
  getDocs: (...a: unknown[]) => getDocs(...a),
  deleteDoc: (...a: unknown[]) => deleteDoc(...a),
}));
vi.mock("./firebase", () => ({ fb: () => ({ db: "db" }) }));

import {
  createShare,
  loadShare,
  revokeShares,
  SHARE_DAYS,
  type ShareSnapshot,
} from "./share";

const zone = {
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
const snap = (over: Record<string, unknown> = {}) =>
  ({
    v: 1,
    org: "Org",
    region: { name: "R", center: [-64, -38], zoom: 5 },
    baseLayer: "esri",
    features: [zone, { id: "malo" }],
    meta: {},
    fires: [],
    days: ["2026-10-22"],
    createdAt: 1,
    ...over,
  }) as unknown as ShareSnapshot;
const answer = (data: unknown) =>
  getDoc.mockResolvedValue({ data: () => data });
const TOKEN = "a".repeat(32);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createShare", () => {
  test("genera un token de 32 caracteres url-safe y vence en 7 días", async () => {
    const before = Date.now();
    const { token, expiresAt } = await createShare("u1", snap());
    expect(token).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(expiresAt).toBeGreaterThanOrEqual(before + SHARE_DAYS * 86_400_000);
    const [ref, body] = setDoc.mock.calls[0];
    expect(ref.path).toBe(`shares/${token}`);
    expect(body.owner).toBe("u1");
    expect(JSON.parse(body.json).org).toBe("Org");
  });

  test("dos enlaces no repiten token", async () => {
    const a = await createShare("u1", snap());
    const b = await createShare("u1", snap());
    expect(a.token).not.toBe(b.token);
  });
});

describe("loadShare", () => {
  test("un token mal formado ni siquiera consulta la base", async () => {
    expect(await loadShare("corto")).toBeNull();
    expect(getDoc).not.toHaveBeenCalled();
  });

  test("devuelve la foto sin las geometrías inválidas", async () => {
    const exp = Date.now() + 1000;
    answer({ json: JSON.stringify(snap()), expiresAt: exp });
    const s = await loadShare(TOKEN);
    expect(s?.features.map((f) => f.id)).toEqual(["z1"]);
    expect(s?.expiresAt).toBe(exp);
  });

  test.each([
    ["inexistente", undefined],
    ["sin json", { expiresAt: Date.now() + 1000 }],
    ["vencido", { json: JSON.stringify(snap()), expiresAt: Date.now() - 1 }],
    [
      "versión desconocida",
      { json: JSON.stringify(snap({ v: 2 })), expiresAt: Date.now() + 1000 },
    ],
    [
      "sin focos",
      {
        json: JSON.stringify({ ...snap(), fires: undefined }),
        expiresAt: Date.now() + 1000,
      },
    ],
  ])("%s -> null", async (_n, data) => {
    answer(data);
    expect(await loadShare(TOKEN)).toBeNull();
  });

  test("completa con valores por defecto lo que falta", async () => {
    answer({
      json: JSON.stringify({ v: 1, features: [], fires: [] }),
      expiresAt: Date.now() + 1000,
    });
    const s = await loadShare(TOKEN);
    expect(s).toMatchObject({ org: "", baseLayer: "esri", days: [], meta: {} });
    expect(s?.region.zoom).toBe(5);
  });
});

describe("revokeShares", () => {
  test("borra todos los enlaces de la cuenta y dice cuántos", async () => {
    const docs = [{ ref: "a" }, { ref: "b" }];
    getDocs.mockResolvedValue({ docs, size: 2 });
    expect(await revokeShares("u1")).toBe(2);
    expect(deleteDoc).toHaveBeenCalledTimes(2);
  });
});
