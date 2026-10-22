"use client";

import { useMemo, useState } from "react";
import { Command as CommandIcon, MapPin } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { MODE_ROLE } from "@/lib/admin/types";
import type { Ctx } from "./ctx";

export interface PaletteAction {
  id: string;
  group: string;
  label: string;
  hint?: string;
  run: () => void;
}

const RECENT_KEY = "sentinel-admin-palette-recent";
const RECENT_MAX = 5;
const FEATURE_MAX = 60;

const ROLE_LABEL: Record<string, string> = {
  zone: "Zona",
  line: "Línea",
  route: "Ruta",
  sensor: "Sensor",
};

function readRecent(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(raw)
      ? raw.filter((x): x is string => typeof x === "string").slice(0, RECENT_MAX)
      : [];
  } catch {
    return [];
  }
}

function pushRecent(prev: string[], id: string): string[] {
  const next = [id, ...prev.filter((x) => x !== id)].slice(0, RECENT_MAX);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* private mode or quota: the list just won't persist */
  }
  return next;
}

export function CommandPalette({
  open,
  setOpen,
  actions,
  ctx,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  actions: PaletteAction[];
  ctx: Ctx;
}) {
  // lazy init: the palette is only mounted client-side (see admin-app)
  const [recent, setRecent] = useState<string[]>(readRecent);
  const groups = [...new Set(actions.map((a) => a.group))];
  const recentActions = recent
    .map((id) => actions.find((a) => a.id === id))
    .filter((a): a is PaletteAction => Boolean(a));

  const { features, meta } = ctx.ws;
  const places = useMemo(
    () =>
      features
        .map((f) => {
          const name = meta[f.id]?.name ?? String(f.properties.name ?? "");
          return { f, name: name.trim() };
        })
        .filter((p) => p.name)
        .slice(0, FEATURE_MAX),
    [features, meta],
  );

  const runAction = (a: PaletteAction) => {
    setRecent((r) => pushRecent(r, a.id));
    setOpen(false);
    a.run();
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Paleta de comandos"
      description="Buscá una acción, región, zona o panel"
    >
      <CommandInput placeholder="Ir a… cambiar vista… exportar… zona…" />
      <CommandList>
        <CommandEmpty>Sin resultados.</CommandEmpty>
        {recentActions.length > 0 && (
          <CommandGroup heading="Recientes">
            {recentActions.map((a) => (
              <CommandItem
                key={`recent-${a.id}`}
                value={`Recientes ${a.group} ${a.label}`}
                onSelect={() => runAction(a)}
              >
                <CommandIcon className="size-4 opacity-40" aria-hidden />
                {a.label}
                <CommandShortcut>{a.group}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {groups.map((g) => (
          <CommandGroup key={g} heading={g}>
            {actions
              .filter((a) => a.group === g)
              .map((a) => (
                <CommandItem
                  key={a.id}
                  value={`${a.group} ${a.label}`}
                  onSelect={() => runAction(a)}
                >
                  <CommandIcon className="size-4 opacity-40" aria-hidden />
                  {a.label}
                  {a.hint && <CommandShortcut>{a.hint}</CommandShortcut>}
                </CommandItem>
              ))}
          </CommandGroup>
        ))}
        {places.length > 0 && (
          <CommandGroup heading="Zonas y elementos">
            {places.map(({ f, name }) => (
              <CommandItem
                key={f.id}
                value={`Zonas y elementos ${name} ${f.id}`}
                onSelect={() => {
                  setOpen(false);
                  ctx.select(f.id);
                  ctx.map.current?.fitFeature(f);
                }}
              >
                <MapPin className="size-4 opacity-40" aria-hidden />
                {name}
                <CommandShortcut>
                  {ROLE_LABEL[MODE_ROLE[String(f.properties.mode)] ?? ""] ?? "Elemento"}
                </CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
