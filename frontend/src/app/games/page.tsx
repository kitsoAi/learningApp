"use client";

import Link from "next/link";
import { ArrowRight, BookOpenText, Grid2x2, Swords } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const games = [
  {
    href: "/games/setswana",
    title: "Dithamalakane le Diane",
    description:
      "Araba dipotso tsa Setswana ka dithamalakane le diane. Tlhopha karolo, latela score, mme o boele gape.",
    badge: "Quiz Game",
    icon: BookOpenText,
    accentClassName: "bg-amber-100 text-amber-800",
  },
  {
    href: "/games/morris",
    title: "Twelve Men's Morris",
    description:
      "Local two-player board game e o ka e tshamekang mo sesebedisweng se le sengwe ka go aba ditshono.",
    badge: "Board Game",
    icon: Swords,
    accentClassName: "bg-emerald-100 text-emerald-800",
  },
];

export default function GamesPage() {
  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,_#ecfccb_0%,_#ffffff_34%,_#f8fafc_100%)] p-8 shadow-sm">
        <div className="max-w-3xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Games Hub</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Tlhopha motshameko o o batlang go o tshameka
          </h1>
          <p className="mt-3 text-base font-medium leading-7 text-slate-600">
            `/games` jaanong ke lefelo la gago la motshameko mo Puolingo. Re ka oketsa le mengwe motlhofo mo nakong e e tlang.
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {games.map((game) => {
          const Icon = game.icon;
          return (
            <Link key={game.href} href={game.href}>
              <Card className="h-full rounded-[2rem] border-slate-200 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md">
                <CardContent className="p-6">
                  <div
                    className={`mb-5 inline-flex rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] ${game.accentClassName}`}
                  >
                    {game.badge}
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">{game.title}</h2>
                      <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{game.description}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-6 flex items-center gap-2 text-sm font-bold text-emerald-700">
                    Bula motshameko
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Grid2x2 className="h-5 w-5 text-slate-600" />
          <h2 className="text-lg font-extrabold text-slate-900">Go oketsa metshameko e mengwe</h2>
        </div>
        <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
          O ka tsenya game e ntšha e le route e ntšha ka fa tlase ga `/games/` mme o e tsenye mo lenaaneng le le fa godimo.
        </p>
      </div>
    </div>
  );
}
