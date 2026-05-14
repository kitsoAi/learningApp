"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Brain, Gamepad2, RotateCcw, Sparkles, Swords, Volume2, VolumeX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BOARD_POINTS,
  CONNECTIONS,
  type MorrisMode,
  applyAIMove,
  applyHumanAction,
  createInitialState,
  getAIMove,
  getLegalMoves,
  getRemovablePoints,
  type MorrisState,
} from "@/lib/games/twelve-mens-morris";

type GameStats = {
  wins: number;
  losses: number;
  gamesPlayed: number;
};

const STORAGE_KEY = "setswana-games-morris-stats";

function readStats(): GameStats {
  if (typeof window === "undefined") {
    return { wins: 0, losses: 0, gamesPlayed: 0 };
  }

  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return { wins: 0, losses: 0, gamesPlayed: 0 };
  }

  try {
    return JSON.parse(saved) as GameStats;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return { wins: 0, losses: 0, gamesPlayed: 0 };
  }
}

function playTone(enabled: boolean, frequency: number, duration = 0.12) {
  if (!enabled || typeof window === "undefined") {
    return;
  }

  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) {
    return;
  }

  const context = new AudioContextCtor();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.03;
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

export function TwelveMensMorrisGame() {
  const [mode, setMode] = useState<MorrisMode>("2player");
  const [soundOn, setSoundOn] = useState(true);
  const [stats, setStats] = useState<GameStats>(() => readStats());
  const [state, setState] = useState<MorrisState>(() => createInitialState());

  const recordResult = useCallback((winner: 1 | 2 | null) => {
    if (mode !== "ai" || winner === null) {
      return;
    }

    setStats((current) => {
      const next = {
        wins: current.wins + (winner === 1 ? 1 : 0),
        losses: current.losses + (winner === 2 ? 1 : 0),
        gamesPlayed: current.gamesPlayed + 1,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [mode]);

  useEffect(() => {
    if (mode !== "ai" || state.gameOver || state.currentPlayer !== 2) {
      return;
    }

    const timer = window.setTimeout(() => {
      const move = getAIMove(state);
      if (!move) {
        return;
      }
      const next = applyAIMove(state, move);
      playTone(soundOn, next.removingPiece ? 660 : 520);
      if (next.gameOver) {
        recordResult(next.winner);
      }
      setState(next);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [mode, recordResult, soundOn, state]);

  const highlightedPoints = useMemo(() => {
    if (state.removingPiece) {
      return getRemovablePoints(state.board, state.currentPlayer === 1 ? 2 : 1);
    }
    if (state.phase === "movement" && state.selectedPoint !== null) {
      return getLegalMoves(state, state.selectedPoint);
    }
    return state.board
      .map((piece, index) => ({ piece, index }))
      .filter(({ piece }) => state.phase === "placement" ? piece === 0 : piece === state.currentPlayer)
      .map(({ index }) => index);
  }, [state]);

  const startNewGame = (nextMode: MorrisMode) => {
    setMode(nextMode);
    setState(createInitialState());
  };

  const resetStats = () => {
    const cleared = { wins: 0, losses: 0, gamesPlayed: 0 };
    setStats(cleared);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleared));
  };

  const onPointClick = (point: number) => {
    const result = applyHumanAction(state, point);
    if (!result.changed) {
      return;
    }
    playTone(soundOn, result.nextState.removingPiece ? 660 : 440);
    if (result.nextState.gameOver) {
      recordResult(result.nextState.winner);
    }
    setState(result.nextState);
  };

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-emerald-100 bg-[radial-gradient(circle_at_top_left,_rgba(187,247,208,0.7),_rgba(255,255,255,1)_55%)] p-8 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Setswana Games</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Play Twelve Men&apos;s Morris inside Puolingo</h1>
            <p className="mt-3 text-base font-medium text-slate-600">
              Keep the learning platform open and jump straight into a classic strategy game inspired by regional play traditions.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant={mode === "2player" ? "secondary" : "outline"} onClick={() => startNewGame("2player")}>
              <Swords className="mr-2 h-4 w-4" />
              Two Players
            </Button>
            <Button variant={mode === "ai" ? "secondary" : "outline"} onClick={() => startNewGame("ai")}>
              <Brain className="mr-2 h-4 w-4" />
              Play vs Computer
            </Button>
            <Button variant="outline" onClick={() => setSoundOn((value) => !value)}>
              {soundOn ? <Volume2 className="mr-2 h-4 w-4" /> : <VolumeX className="mr-2 h-4 w-4" />}
              {soundOn ? "Sound On" : "Sound Off"}
            </Button>
            <Button variant="outline" onClick={() => setState(createInitialState())}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Restart
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-hidden rounded-[2rem] border-slate-200 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="mx-auto max-w-[720px] rounded-[1.75rem] bg-slate-950 p-4 sm:p-6">
              <svg viewBox="0 0 100 100" className="aspect-square w-full">
                {CONNECTIONS.map(([from, to]) => (
                  <line
                    key={`${from}-${to}`}
                    x1={BOARD_POINTS[from].x}
                    y1={BOARD_POINTS[from].y}
                    x2={BOARD_POINTS[to].x}
                    y2={BOARD_POINTS[to].y}
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                ))}
                {BOARD_POINTS.map((point, index) => {
                  const piece = state.board[index];
                  const isSelected = state.selectedPoint === index;
                  const isHighlighted = highlightedPoints.includes(index);
                  return (
                    <g key={index}>
                      {isHighlighted ? (
                        <circle cx={point.x} cy={point.y} r="5.8" fill={state.removingPiece ? "rgba(248,113,113,0.25)" : "rgba(74,222,128,0.26)"} />
                      ) : null}
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="3.8"
                        fill={piece === 1 ? "#38bdf8" : piece === 2 ? "#fb7185" : "#ffffff"}
                        stroke={isSelected ? "#fde047" : "#0f172a"}
                        strokeWidth={isSelected ? "1.4" : "1"}
                        className="cursor-pointer transition-transform hover:scale-110"
                        onClick={() => onPointClick(index)}
                      />
                      {piece !== 0 ? (
                        <circle
                          cx={point.x - 0.7}
                          cy={point.y - 0.7}
                          r="1.25"
                          fill={piece === 1 ? "#e0f2fe" : "#ffe4e6"}
                          pointerEvents="none"
                        />
                      ) : null}
                    </g>
                  );
                })}
              </svg>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[2rem] border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
                <Gamepad2 className="h-5 w-5 text-emerald-600" />
                Match Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{mode === "ai" ? "Single Player" : "Local Versus"}</Badge>
                <Badge variant="outline">{state.phase === "placement" ? "Placement Phase" : "Movement Phase"}</Badge>
                {state.gameOver ? (
                  <Badge variant={state.winner === 1 ? "secondary" : "danger"}>
                    {mode === "ai" ? (state.winner === 1 ? "You Win" : "Computer Wins") : `Player ${state.winner} Wins`}
                  </Badge>
                ) : (
                  <Badge variant={state.currentPlayer === 1 ? "secondary" : "super"}>
                    {mode === "ai" ? (state.currentPlayer === 1 ? "Your Turn" : "Computer Turn") : `Player ${state.currentPlayer} Turn`}
                  </Badge>
                )}
              </div>
              <p className="text-sm font-medium leading-6 text-slate-600">{state.lastAction}</p>
              <div className="grid gap-3">
                <div className="rounded-2xl bg-sky-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Player One</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">Pieces to place: {state.unplacedPieces[0]}</p>
                  <p className="text-sm font-semibold text-slate-700">Pieces on board: {state.boardPieces[0]}</p>
                </div>
                <div className="rounded-2xl bg-rose-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-700">
                    {mode === "ai" ? "Computer" : "Player Two"}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">Pieces to place: {state.unplacedPieces[1]}</p>
                  <p className="text-sm font-semibold text-slate-700">Pieces on board: {state.boardPieces[1]}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Game Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm font-medium leading-6 text-slate-600">
              <p>Players first place all 12 pieces one at a time. Every line of three forms a mill and lets you remove an opposing piece.</p>
              <p>Once all pieces are placed, select one of your pieces and move it along a connected line to an empty point.</p>
              <p>If you are reduced to three pieces, you can jump to any empty point on the board.</p>
              <p>Win by reducing your opponent below three active pieces or by blocking every legal move.</p>
            </CardContent>
          </Card>

          {mode === "ai" ? (
            <Card className="rounded-[2rem] border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-extrabold text-slate-900">Your Record</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl bg-emerald-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Wins</p>
                    <p className="mt-2 text-2xl font-extrabold text-slate-900">{stats.wins}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-100 p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Games</p>
                    <p className="mt-2 text-2xl font-extrabold text-slate-900">{stats.gamesPlayed}</p>
                  </div>
                  <div className="rounded-2xl bg-rose-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-700">Losses</p>
                    <p className="mt-2 text-2xl font-extrabold text-slate-900">{stats.losses}</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={resetStats}>
                  Reset Record
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
