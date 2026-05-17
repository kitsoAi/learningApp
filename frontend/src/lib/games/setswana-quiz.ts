import type {
  SetswanaCategory,
  SetswanaProverbItem,
  SetswanaRiddleItem,
} from "@/types/games";

export type QuizPrompt = {
  id: number;
  question: string;
  correctAnswer: string;
  options: string[];
  imageLabel?: string;
  questionAudio?: string;
  answerAudio?: string;
};

export function shuffleArray<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

export function normalizeCategory(category: SetswanaCategory): QuizPrompt[] {
  return category.items.map((item) => {
    if (category.id === "dithamalakane") {
      const riddle = item as SetswanaRiddleItem;
      return {
        id: riddle.id,
        question: riddle.lelepa,
        correctAnswer: riddle.answer,
        options: shuffleArray(riddle.options),
        imageLabel: riddle.imageLabel,
        questionAudio: riddle.questionAudio,
        answerAudio: riddle.answerAudio,
      };
    }

    const proverb = item as SetswanaProverbItem;
    return {
      id: proverb.id,
      question: proverb.seane,
      correctAnswer: proverb.tlhaloso,
      options: shuffleArray(proverb.options),
      imageLabel: proverb.imageLabel,
      questionAudio: proverb.questionAudio,
      answerAudio: proverb.answerAudio,
    };
  });
}

