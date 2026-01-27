"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useWindowSize } from "react-use";
import Confetti from "react-confetti";
import Image from "next/image";

import { Challenge } from "@/types/api";
import { Header } from "./header";
import { QuestionBubble } from "./question-bubble";
import { ChallengeComponent } from "./challenge";
import { Footer } from "./footer";
import { progressApi } from "@/lib/api/courses";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth";
import { useCourseStore } from "@/store/course";

type Props = {
  initialLessonId: number;
  initialLessonChallenges: (Challenge & { completed?: boolean })[];
  initialHearts: number;
  initialPercentage: number;
  userSubscription: {
    id: number;
    user_id: number;
    active: boolean;
  } | null;
};

export const Quiz = ({
  initialLessonId,
  initialLessonChallenges,
  initialHearts,
  initialPercentage,
  userSubscription,
}: Props) => {
  const { width, height } = useWindowSize();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { fetchUser } = useAuthStore();
  const { completeLesson } = useCourseStore();

  const [hearts, setHearts] = useState(initialHearts);
  const [percentage, setPercentage] = useState(initialPercentage);
  const [challenges] = useState(initialLessonChallenges);
  const [activeIndex, setActiveIndex] = useState(() => {
    const uncompletedIndex = challenges.findIndex((challenge) => !challenge.completed);
    return uncompletedIndex === -1 ? 0 : uncompletedIndex;
  });

  const [selectedOption, setSelectedOption] = useState<number | string>();
  const [status, setStatus] = useState<"none" | "correct" | "wrong">("none");

  const challenge = challenges[activeIndex];
  const options = challenge?.options ?? [];

  const onNext = () => {
    setActiveIndex((current) => current + 1);
    setStatus("none");
    setSelectedOption(undefined);
  };

  const onSelect = (id: number | string) => {
    if (status !== "none") return;
    setSelectedOption(id);
  };

  const onContinue = async () => {
    if (!selectedOption) return;

    if (status === "correct") {
      onNext();
      return;
    }

    if (status === "wrong") {
      setStatus("none");
      setSelectedOption(undefined);
      return;
    }

    let isCorrect = false;

    if (challenge.type === "SELECT" || challenge.type === "ASSIST" || challenge.type === "LISTEN_SELECT") {
        const correctOption = options.find((option) => option.correct);
        isCorrect = correctOption?.id === selectedOption;
    } else if (challenge.type === "TRANSLATE" || challenge.type === "LISTEN_TYPE" || challenge.type === "TAP_HEAR" || challenge.type === "SPEAK") {
        // Simple string comparison, normalizing case and whitespace
        const normalizedAnswer = String(selectedOption).toLowerCase().trim()
            .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "") // Remove punctuation
            .replace(/\s{2,}/g, " "); // Remove extra spaces
        const normalizedCorrect = challenge.correct_text?.toLowerCase().trim()
            .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
            .replace(/\s{2,}/g, " ");
        isCorrect = normalizedAnswer === normalizedCorrect;
    } else if (challenge.type === "MATCH") {
        isCorrect = selectedOption === "MATCHED";
    }

    if (isCorrect) {
      setStatus("correct");
      setPercentage((prev) => prev + 100 / challenges.length);
      new Audio("/assets/correct.mp3").play().catch(() => {});
    } else {
      setStatus("wrong");
      new Audio("/assets/wrong.mp3").play().catch(() => {});
      if (!userSubscription) {
        setHearts((prev) => Math.max(prev - 1, 0));
        // TODO: show hearts modal if 0
      }
    }
  };

  if (!challenge) {
    return (
      <>
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.2}
        />
        <div className="flex flex-col gap-y-4 lg:gap-y-8 max-w-lg mx-auto text-center items-center justify-center h-full">
          <Image
            src="/finish.svg"
            alt="Finish"
            className="hidden lg:block shadow-md rounded-xl"
            height={100}
            width={100}
          />
          <Image
            src="/finish.svg"
            alt="Finish"
            className="block lg:hidden shadow-md rounded-xl"
            height={50}
            width={50}
          />
          <h1 className="text-xl lg:text-3xl font-bold text-neutral-700">
            Great job! <br /> You&apos;ve completed the lesson.
          </h1>
          <div className="flex items-center gap-x-4 w-full">
            <div className="p-6 border-2 rounded-2xl flex-1 bg-white shadow-sm">
                <p className="text-neutral-400 font-bold uppercase text-xs">Total XP</p>
                <p className="text-neutral-700 font-bold text-lg">10</p>
            </div>
          </div>
        </div>
        <Footer
          lessonId={initialLessonId}
          status="completed"
          onCheck={() => {
            startTransition(async () => {
                new Audio("/assets/lesson_finish.mp3").play().catch(() => {});
                try {
                    await progressApi.completeLesson(initialLessonId, initialHearts - hearts, 10);
                    completeLesson(initialLessonId); // Optimistic update
                    await fetchUser(); // Refresh user state (hearts, points)
                    router.push("/learn");
                    router.refresh(); // Force refetch of learn page data
                } catch {
                    toast.error("Something went wrong. Please try again.");
                    router.push("/learn");
                }
            });
          }}
        />
      </>
    );
  }

  const title = challenge.type === "ASSIST" 
    ? "Select the correct meaning"
    : challenge.type === "TRANSLATE"
        ? "Translate this sentence"
        : challenge.type === "MATCH"
            ? "Match the pairs"
            : challenge.type === "LISTEN_TYPE" || challenge.type === "LISTEN_SELECT"
                ? "Listen and complete the challenge"
                : challenge.type === "SPEAK"
                    ? "Speak this sentence"
                    : "Select the correct option";

  const mascotSrc = status === "correct" 
    ? "/mascot_zebra_happy.png" 
    : status === "wrong" 
        ? "/mascot_kori_sad.png" 
        : "/mascot_kori_neutral.png";

  return (
    <>
      <Header
        hearts={hearts}
        percentage={percentage}
        hasActiveSubscription={!!userSubscription}
      />
      <div className="flex-1">
        <div className="h-full flex items-center justify-center">
          <div className="lg:min-h-[350px] lg:w-[600px] w-full px-6 lg:px-0 flex flex-col gap-y-12">
            <h1 className="text-xl lg:text-3xl text-center lg:text-start font-bold text-neutral-700 tracking-tight">
              {title}
            </h1>
            
            <div className="flex flex-col gap-y-6">
              <div className="flex items-center gap-x-4 mb-2">
                <Image 
                  src={mascotSrc} 
                  height={150} 
                  width={150} 
                  alt="Mascot" 
                  className="hidden lg:block"
                />
                <Image 
                  src={mascotSrc} 
                  height={100} 
                  width={100} 
                  alt="Mascot" 
                  className="block lg:hidden"
                />
                <QuestionBubble 
                  question={challenge.question} 
                  audioSrc={challenge.audio_src}
                />
              </div>

              <ChallengeComponent
                options={options}
                onSelect={onSelect}
                status={status}
                selectedOption={selectedOption}
                disabled={pending}
                type={challenge.type}
                question={challenge.question}
                audioSrc={challenge.audio_src}
              />
            </div>
          </div>
        </div>
      </div>
      <Footer
        disabled={pending || (!selectedOption && status === "none")}
        status={status}
        onCheck={onContinue}
      />
    </>
  );
};
