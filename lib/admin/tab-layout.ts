import type { Tab } from "@/components/admin/ctx";

export interface TabLayoutInput {
  tabs: readonly { id: Tab; essential: boolean }[];
  /** simple mode: only the essential tabs are candidates for the bar, the rest always sit under "Más" */
  simple: boolean;
  /** how wide each tab wants to be, in px (gap included) */
  widths: Readonly<Record<string, number>>;
  /** room the bar has */
  avail: number;
  /** width of the "Más" button */
  moreW: number;
  active: Tab;
}

/** Which tabs go in the bar and which under "Más". The active tab is always in the bar. Never mutates its input. */
export function layoutTabs(i: TabLayoutInput): {
  visible: Tab[];
  hidden: Tab[];
} {
  const ids = i.tabs.map((x) => x.id);
  const primary = i.simple
    ? i.tabs.filter((x) => x.essential).map((x) => x.id)
    : ids;
  const secondary = i.simple
    ? i.tabs.filter((x) => !x.essential).map((x) => x.id)
    : [];
  const w = (id: Tab) => i.widths[id] ?? 0;

  if (!i.simple && primary.reduce((s, id) => s + w(id), 0) <= i.avail)
    return { visible: primary, hidden: [] };

  let used = i.moreW;
  let n = 0;
  for (const id of primary) {
    if (used + w(id) > i.avail) break;
    used += w(id);
    n++;
  }
  n = Math.max(1, n);
  let visible = primary.slice(0, n);
  let hidden = [...primary.slice(n), ...secondary];

  if (hidden.includes(i.active)) {
    if (
      i.simple &&
      secondary.includes(i.active) &&
      used + w(i.active) <= i.avail
    ) {
      // room to spare: show it next to the essentials instead of pushing one of them out
      visible = [...visible, i.active];
    } else {
      // the active tab trades places with the last one in the bar
      const last = visible[visible.length - 1];
      visible = [...visible.slice(0, -1), i.active];
      hidden = hidden.filter((id) => id !== i.active).concat(last);
    }
    hidden = hidden.filter((id) => !visible.includes(id));
    hidden.sort((a, b) => ids.indexOf(a) - ids.indexOf(b));
  }
  return { visible, hidden };
}
