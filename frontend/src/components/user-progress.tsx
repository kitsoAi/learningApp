import { InfinityIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { formatAssetUrl } from "@/lib/utils";

type UserProgressProps = {
  activeCourse: {
    title: string;
    imageSrc: string;
  };
  hearts: number;
  points: number;
  hasActiveSubscription: boolean;
};

export const UserProgress = ({
  activeCourse,
  hearts,
  points,
  hasActiveSubscription,
}: UserProgressProps) => {
  return (
    <div className="flex w-full items-center justify-between gap-x-2">
      <Link href="/courses">
        <Button variant="ghost">
          <div className="relative aspect-[4/3] w-10 overflow-hidden rounded-md border">
            <Image
              src={formatAssetUrl(activeCourse.imageSrc) || "/es.svg"}
              alt={activeCourse.title}
              fill
              className="object-cover"
            />
          </div>
        </Button>
      </Link>

      <Button variant="ghost" className="cursor-default text-orange-500 hover:bg-transparent">
        <Image
          src="/points.svg"
          height={28}
          width={28}
          alt="Points"
          className="mr-2"
        />
        {points}
      </Button>

      <Button variant="ghost" className="cursor-default text-rose-500 hover:bg-transparent">
        <Image
          src="/heart.svg"
          height={22}
          width={22}
          alt="Hearts"
          className="mr-2"
        />
        {hasActiveSubscription ? (
          <InfinityIcon className="stroke-3 h-4 w-4" />
        ) : (
          hearts
        )}
      </Button>
    </div>
  );
};
