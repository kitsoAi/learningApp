"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";

type SidebarItemProps = {
  label: string;
  iconSrc: string;
  href: string;
  external?: boolean;
};

export const SidebarItem = ({ label, iconSrc, href, external = false }: SidebarItemProps) => {
  const pathname = usePathname();
  const isActive = !external && pathname === href;

  return (
    <Button
      variant={isActive ? "sidebarOutline" : "sidebar"}
      className="h-[52px] justify-start"
      asChild
    >
      {external ? (
        <a href={href} target="_blank" rel="noreferrer">
          <Image
            src={iconSrc}
            alt={label}
            className="mr-5"
            height={32}
            width={32}
          />
          {label}
        </a>
      ) : (
        <Link href={href}>
          <Image
            src={iconSrc}
            alt={label}
            className="mr-5"
            height={32}
            width={32}
          />
          {label}
        </Link>
      )}
    </Button>
  );
};
