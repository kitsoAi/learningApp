"use client";

import gameData from "../../../../../data/setswana-game.json";
import { SetswanaCategoryQuiz } from "@/components/games/setswana-category-quiz";
import type { SetswanaCategory, SetswanaGameData } from "@/types/games";

const data = gameData as SetswanaGameData;
const category = data.categories.find((item) => item.id === "dithamalakane") as SetswanaCategory;

export default function DithamalakanePage() {
  return (
    <SetswanaCategoryQuiz
      category={category}
      data={data}
      backHref="/games/setswana"
      backLabel="Boela kwa hubong"
    />
  );
}

