"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Volume2 } from "lucide-react";

type Item = {
  id: number;
  text: string;
  type: "source" | "target";
  pairId: number;
  audioSrc?: string;
};

type Props = {
  pairs: { source: string; target: string; id: number; audioSrc?: string }[];
  onComplete: (success: boolean) => void;
  disabled?: boolean;
};

export const MatchingPairs = ({ pairs, onComplete, disabled }: Props) => {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedSource, setSelectedSource] = useState<number | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<number | null>(null);
  const [matchedIds, setMatchedIds] = useState<number[]>([]);
  const [wrongMatch, setWrongMatch] = useState<{ source: number; target: number } | null>(null);

  useEffect(() => {
    const sourceItems: Item[] = pairs.map(p => ({ id: p.id, text: p.source, type: "source", pairId: p.id, audioSrc: p.audioSrc }));
    const targetItems: Item[] = pairs.map(p => ({ id: p.id + 1000, text: p.target, type: "target", pairId: p.id }));
    const combined = [...sourceItems, ...targetItems];
    
    // Fisher-Yates shuffle
    for (let i = combined.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [combined[i], combined[j]] = [combined[j], combined[i]];
    }
    setItems(combined);
  }, [pairs]);

  const onSelect = useCallback((item: Item) => {
    if (disabled || matchedIds.includes(item.pairId)) return;

    if (item.audioSrc) {
       new Audio(item.audioSrc).play().catch(() => {});
    }

    if (item.type === "source") {
        if (selectedTarget !== null) {
            const target = items.find(i => i.id === selectedTarget);
            if (target && target.pairId === item.pairId) {
                const newMatched = [...matchedIds, item.pairId];
                setMatchedIds(newMatched);
                setSelectedTarget(null);
                if (newMatched.length === pairs.length) onComplete(true);
            } else {
                setWrongMatch({ source: item.id, target: selectedTarget });
                setTimeout(() => {
                    setWrongMatch(null);
                    setSelectedTarget(null);
                }, 500);
            }
        } else {
            setSelectedSource(item.id);
        }
    } else {
        if (selectedSource !== null) {
            const source = items.find(i => i.id === selectedSource);
            if (source && source.pairId === item.pairId) {
                const newMatched = [...matchedIds, item.pairId];
                setMatchedIds(newMatched);
                setSelectedSource(null);
                if (newMatched.length === pairs.length) onComplete(true);
            } else {
                setWrongMatch({ source: selectedSource, target: item.id });
                setTimeout(() => {
                    setWrongMatch(null);
                    setSelectedSource(null);
                }, 500);
            }
        } else {
            setSelectedTarget(item.id);
        }
    }
  }, [disabled, matchedIds, items, selectedSource, selectedTarget, pairs.length, onComplete]);

  return (
    <div className="grid grid-cols-2 gap-4">
      {items.map((item) => {
        const isMatched = matchedIds.includes(item.pairId);
        const isSelected = selectedSource === item.id || selectedTarget === item.id;
        const isWrong = wrongMatch?.source === item.id || wrongMatch?.target === item.id;

        return (
          <Button
            key={item.id}
            variant="outline"
            disabled={disabled || isMatched}
            onClick={() => onSelect(item)}
            className={cn(
              "h-auto py-6 px-4 text-lg border-2 border-b-4 transition-all duration-200",
              isSelected && "border-sky-300 bg-sky-100",
              isMatched && "opacity-0 pointer-events-none",
              isWrong && "border-rose-400 bg-rose-100 animate-shake"
            )}
          >
            <div className="flex items-center gap-x-2">
                {item.audioSrc && <Volume2 className="h-4 w-4 text-sky-500" />}
                {item.text}
            </div>
          </Button>
        );
      })}
    </div>
  );
};
