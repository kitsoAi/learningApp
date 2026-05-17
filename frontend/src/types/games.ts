export type SetswanaUiLabels = {
  chooseAnswer: string;
  correct: string;
  wrong: string;
  next: string;
  results: string;
  retry: string;
  backToCategories: string;
};

export type SetswanaRiddleItem = {
  id: number;
  lelepa: string;
  answer: string;
  options: string[];
  imageLabel?: string;
  questionAudio?: string;
  answerAudio?: string;
};

export type SetswanaProverbItem = {
  id: number;
  seane: string;
  tlhaloso: string;
  options: string[];
  imageLabel?: string;
  questionAudio?: string;
  answerAudio?: string;
};

export type SetswanaCategory =
  | {
      id: "dithamalakane";
      title: string;
      type: "riddle_game";
      instruction: string;
      items: SetswanaRiddleItem[];
    }
  | {
      id: "diane";
      title: string;
      type: "proverb_meaning_match";
      instruction: string;
      items: SetswanaProverbItem[];
    };

export type SetswanaGameData = {
  gameTitle: string;
  language: string;
  version: string;
  description: string;
  categories: SetswanaCategory[];
  scoring: {
    correctAnswer: number;
    wrongAnswer: number;
    hintPenalty: number;
  };
  uiLabels: SetswanaUiLabels;
};

