"use client";
import { useState, useCallback } from "react";
import { correctSet, isAnswerCorrect, isMultiAnswer, type Question } from "@/data/types";
import { useCert } from "@/components/certProvider";
import { AceCert } from "@/data/ace";
import { useClientPick } from "@/lib/useClientPick";
import SecBadge from "@/components/secBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function QuizMode({ section, topic }: Readonly<{ section: number; topic: string | null }>) {
  const cert = useCert() ?? AceCert;
  const [picks, setPicks] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ c: 0, t: 0 });
  const [dots, setDots] = useState<boolean[]>([]);

  const { mounted, item: q, setItem: setQ } = useClientPick<Question>(
    () => cert.getRandomQuestion(section, topic, null),
    section,
    topic,
    () => { setPicks([]); setRevealed(false); },
  );

  const load = useCallback(() => {
    setPicks([]);
    setRevealed(false);
    setQ(cert.getRandomQuestion(section, topic, q?.id ?? null));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, topic]);

  const multi = q ? isMultiAnswer(q) : false;
  const need = q ? correctSet(q).length : 1;

  const reveal = (finalPicks: string[]) => {
    if (!q) return;
    const ok = isAnswerCorrect(q, finalPicks);
    setRevealed(true);
    setScore((s) => ({ c: s.c + (ok ? 1 : 0), t: s.t + 1 }));
    setDots((d) => [ok, ...d].slice(0, 10));
  };

  const pick = (opt: string) => {
    if (revealed || !q) return;
    if (!multi) {
      setPicks([opt]);
      reveal([opt]);
      return;
    }
    setPicks((prev) => {
      if (prev.includes(opt)) return prev.filter((o) => o !== opt);
      if (prev.length >= need) return prev;
      return [...prev, opt];
    });
  };

  const optClass = (opt: string) =>
    cn(
      "opt-btn",
      revealed && correctSet(q!).includes(opt) && "opt-btn--correct",
      revealed && picks.includes(opt) && !correctSet(q!).includes(opt) && "opt-btn--wrong",
      revealed && !picks.includes(opt) && !correctSet(q!).includes(opt) && "opt-btn--dimmed",
      !revealed && multi && picks.includes(opt) && "opt-btn--selected",
    );

  if (!q) return (
    <Card>
      <CardContent className="py-8 text-center text-muted-foreground text-sm">
        {mounted ? "No questions found for this section/topic." : "Loading…"}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col gap-4">

      {/* Borderless stat row */}
      <div className="flex items-center justify-between px-1">
        <div className="flex gap-8 items-end">
          <div>
            <p
              className="text-3xl font-semibold font-mono leading-none"
              style={{ color: "var(--color-stat-correct)" }}
            >
              {score.c}
            </p>
            <p className="text-xs text-muted-foreground mt-1">correct</p>
          </div>
          <div>
            <p className="text-3xl font-semibold font-mono leading-none text-foreground">{score.t}</p>
            <p className="text-xs text-muted-foreground mt-1">total</p>
          </div>
          {score.t > 0 && (
            <div>
              <p className="text-3xl font-semibold font-mono leading-none text-primary">
                {Math.round((score.c / score.t) * 100)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">accuracy</p>
            </div>
          )}
        </div>
        {/* Recent history dots */}
        <div className="flex gap-1.5 items-center">
          {dots.map((ok, i) => (
            <div
              key={i}
              className="size-2 rounded-full"
              style={{
                background: ok
                  ? "var(--color-bar-correct)"
                  : "var(--color-bar-wrong)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Question card */}
      <Card>
        <CardContent className="flex flex-col gap-5 py-6 px-6">
          <div className="flex items-center justify-between gap-3">
            <SecBadge section={q.section} topic={q.topic} />
            {multi && !revealed && (
              <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full border border-border text-muted-foreground shrink-0">
                Select {need} · {picks.length}/{need}
              </span>
            )}
          </div>
          <p className="font-medium text-base leading-relaxed text-foreground">{q.question}</p>
          <div className="flex flex-col gap-2.5">
            {(Object.entries(q.options) as [string, string][]).map(([opt, text]) => (
              <button
                key={opt}
                disabled={revealed || (multi && !picks.includes(opt) && picks.length >= need)}
                onClick={() => pick(opt)}
                className={optClass(opt)}
              >
                <span className="opt-letter font-mono text-xs size-6 rounded-md bg-muted flex items-center justify-center shrink-0 font-semibold">
                  {opt}
                </span>
                <span className="leading-snug">{text}</span>
              </button>
            ))}
          </div>

          {multi && !revealed && (
            <Button
              disabled={picks.length !== need}
              onClick={() => reveal(picks)}
              size="lg"
              className="w-full font-medium"
            >
              Check Answer
            </Button>
          )}

          {/* Feedback — uses theme-aware --fb-* tokens */}
          {revealed && (
            <div
              className={cn(
                "slide-up rounded-xl px-5 py-4 border-l-4 flex flex-col gap-1.5",
                isAnswerCorrect(q, picks) ? "feedback-correct" : "feedback-wrong",
              )}
            >
              <p className="feedback-title text-sm font-semibold">
                {isAnswerCorrect(q, picks)
                  ? "Correct"
                  : `Incorrect — Answer: ${correctSet(q).join(", ")}`}
              </p>
              <p className="feedback-body text-sm leading-relaxed">{q.explanation}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {revealed && (
        <Button onClick={load} size="lg" className="w-full font-medium">
          Next Question →
        </Button>
      )}
    </div>
  );
}
