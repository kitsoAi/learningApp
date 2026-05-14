"use client";

import Link from "next/link";
import { Hammer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MohelePage() {
  return (
    <Card className="rounded-[2rem] border-slate-200 shadow-sm">
      <CardHeader className="items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <Hammer className="h-8 w-8" />
        </div>
        <CardTitle className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">
          Mohele
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 text-center">
        <p className="text-sm font-medium leading-7 text-slate-600">
          Karolo eno e setse e beilwe mo Setswana game hub. O ka tsenya melao, JSON data kgotsa setshwantsho sa motshameko wa Mohele mo nakong e e tlang.
        </p>
        <p className="text-xs font-medium text-slate-500">
          Fa o batla, nka e aga e le game e e tletseng mo kgatong e e latelang.
        </p>
        <Button asChild variant="outline">
          <Link href="/games/setswana">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Boela kwa hubong
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
