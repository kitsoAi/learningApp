"use client";

import Link from "next/link";
import gameData from "../../../../data/setswana-game.json";
import { ArrowRight, BookMarked, Lightbulb, ScrollText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { SetswanaGameData } from "@/types/games";

const setswanaGameData = gameData as SetswanaGameData;

const hubItems = [
  {
    href: "/games/setswana/mohele",
    title: "Mohele",
    description: "Karolo e e ikemetseng ya motshameko wa puo. E siamiseditswe go amogela dikagare tse dingwe morago.",
    badge: "Soon",
    icon: BookMarked,
    accentClassName: "bg-slate-100 text-slate-700",
  },
  {
    href: "/games/setswana/diane",
    title: "Diane",
    description: "Tlhopha tlhaloso e e nepagetseng ya seane sengwe le sengwe.",
    badge: `${setswanaGameData.categories.find((item) => item.id === "diane")?.items.length ?? 0} dipotso`,
    icon: ScrollText,
    accentClassName: "bg-emerald-100 text-emerald-800",
  },
  {
    href: "/games/setswana/dithamalakane",
    title: "Dithamalakane",
    description: "Buisa lelepa mme o tlhophe karabo e e nepagetseng mo dikgethong tse nne.",
    badge: `${setswanaGameData.categories.find((item) => item.id === "dithamalakane")?.items.length ?? 0} dipotso`,
    icon: Lightbulb,
    accentClassName: "bg-amber-100 text-amber-800",
  },
];

export default function SetswanaGamesPage() {
  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-amber-100 bg-[linear-gradient(135deg,_#fff7ed_0%,_#ffffff_38%,_#f0fdf4_100%)] p-8 shadow-sm">
        <div className="max-w-3xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-amber-700">Setswana Hub</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Mohele, Diane le Dithamalakane
          </h1>
          <p className="mt-3 text-base font-medium leading-7 text-slate-600">
            Tlhopha karolo e o batlang go simolola ka yone. Re ka oketsa ditshwantsho, medumo le dikagare tse dingwe mo hubong ono motlhofo.
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {hubItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="h-full rounded-[2rem] border-slate-200 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md">
                <CardContent className="p-6">
                  <div
                    className={`mb-5 inline-flex rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] ${item.accentClassName}`}
                  >
                    {item.badge}
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">{item.title}</h2>
                      <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{item.description}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-6 flex items-center gap-2 text-sm font-bold text-emerald-700">
                    Bula
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
