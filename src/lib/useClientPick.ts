import { useEffect, useState } from "react";

/**
 * Picks a value client-side only, via `pick`, and re-picks whenever `section`
 * or `topic` change. Never picks during SSR — a non-deterministic `pick`
 * (e.g. Math.random()-based) would otherwise return a different value on the
 * server than on client hydration, causing a hydration mismatch.
 */
export function useClientPick<T>(
  pick: () => T | null,
  section: number,
  topic: string | null,
  onSectionChange?: () => void,
) {
  const [mounted, setMounted] = useState(false);
  const [item, setItem] = useState<T | null>(null);
  const [prevSection, setPrevSection] = useState(section);
  const [prevTopic, setPrevTopic] = useState(topic);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setItem(pick());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (mounted && (prevSection !== section || prevTopic !== topic)) {
    setPrevSection(section);
    setPrevTopic(topic);
    onSectionChange?.();
    setItem(pick());
  }

  return { mounted, item, setItem };
}
