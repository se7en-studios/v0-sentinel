"use client";

import { Command as CommandIcon } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";

export interface PaletteAction {
  id: string;
  group: string;
  label: string;
  hint?: string;
  run: () => void;
}

export function CommandPalette({
  open,
  setOpen,
  actions,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  actions: PaletteAction[];
}) {
  const groups = [...new Set(actions.map((a) => a.group))];
  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Paleta de comandos"
      description="Buscá una acción, región o panel"
    >
      <CommandInput placeholder="Ir a… cambiar vista… exportar…" />
      <CommandList>
        <CommandEmpty>Sin resultados.</CommandEmpty>
        {groups.map((g) => (
          <CommandGroup key={g} heading={g}>
            {actions
              .filter((a) => a.group === g)
              .map((a) => (
                <CommandItem
                  key={a.id}
                  value={`${a.group} ${a.label}`}
                  onSelect={() => {
                    setOpen(false);
                    a.run();
                  }}
                >
                  <CommandIcon className="size-4 opacity-40" aria-hidden />
                  {a.label}
                  {a.hint && <CommandShortcut>{a.hint}</CommandShortcut>}
                </CommandItem>
              ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
