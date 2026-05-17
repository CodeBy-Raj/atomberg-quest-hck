import { Cycle, Quarter } from "./types";

/**
 * Determines the current active quarter based on the provided cycle and current time.
 * @param cycle The active performance cycle
 * @returns The current active Quarter or null if no window is open.
 */
export function getCurrentQuarter(cycle: Cycle | null): Quarter | null {
  if (!cycle) return null;
  const now = new Date();
  
  const window = cycle.windows.find(w => {
    const opens = new Date(w.opensAt);
    const closes = new Date(w.closesAt);
    return now >= opens && now <= closes;
  });

  return (window?.quarter as Quarter) || null;
}
