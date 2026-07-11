"use client";
import { useState, useCallback } from "react";
import type { Flashcard } from "@/data/types";
import { useCert } from "@/components/certProvider";
import { AceCert } from "@/data/ace";
import { useClientPick } from "@/lib/useClientPick";
import SecBadge from "@/components/secBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FlashcardMode({ section, topic }: { section: number; topic: string | null }) {
  const cert = useCert() ?? AceCert;
  const [flipped, setFlipped] = useState(false);
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(true);

  const { mounted, item: card, setItem: setCard } = useClientPick<Flashcard>(
    () => cert.getRandomFlashcard(section, topic, null),
    section,
    topic,
    () => setFlipped(false),
  );

  const load = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setFlipped(false);
      setCard(cert.getRandomFlashcard(section, topic, card?.id ?? null));
      setVisible(true);
    }, 150);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, topic]);

  if (!card) return (
    <Card>
      <CardContent className="py-8 text-center text-muted-foreground text-sm">
        {mounted ? "No flashcards found for this section/topic." : "Loading…"}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Counter */}
      <div className="flex justify-between items-center text-sm text-muted-foreground px-1">
        <span>
          Cards reviewed: <span className="text-foreground font-medium">{count}</span>
        </span>
        <span className="text-xs">Tap card to flip</span>
      </div>

      {/* 3D flip container */}
      <div
        className={cn(
          "flip-scene cursor-pointer select-none",
          "transition-opacity duration-150",
          visible ? "opacity-100" : "opacity-0"
        )}
        style={{ minHeight: 300, height: "clamp(300px, 40vw, 400px)", position: "relative" }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div
          className={cn("flip-inner", flipped && "is-flipped")}
          style={{ height: "100%", width: "100%" }}
        >
          {/* Front — term */}
          <div className="flip-face">
            <Card className="h-full rounded-2xl">
              <CardContent className="h-full flex flex-col justify-between p-8">
                <SecBadge section={card.section} topic={card.term} />

                <p
                  className="text-center leading-snug text-foreground font-semibold tracking-tight"
                  style={{ fontSize: "clamp(1.25rem, 3vw, 1.75rem)" }}
                >
                  {card.term}
                </p>

                <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                  <RotateCcw className="size-3" />
                  <span className="text-xs">Tap to reveal</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Back — definition (tinted blue surface, no inversion) */}
          <div className="flip-face flip-face--back">
            <div
              className="h-full rounded-2xl border flex flex-col justify-between p-8"
              style={{
                background: "oklch(0.491 0.113 244 / 0.07)",
                borderColor: "oklch(0.491 0.113 244 / 0.25)",
              }}
            >
              <SecBadge section={card.section} />

              <div className="py-3 flex flex-col gap-3">
                <p className="text-base leading-relaxed text-foreground">{card.definition}</p>
                {card.context && (
                  <p
                    className="text-sm leading-relaxed text-muted-foreground border-l-2 pl-3"
                    style={{ borderColor: "oklch(0.491 0.113 244 / 0.45)" }}
                  >
                    {card.context}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                <RotateCcw className="size-3" />
                <span className="text-xs">Tap to flip back</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Button
        size="lg"
        className="w-full font-medium"
        onClick={() => { setCount((c) => c + 1); load(); }}
      >
        Next Card →
      </Button>
    </div>
  );
}
