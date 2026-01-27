import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const font = Nunito({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Puolingo - Learn Languages",
  description: "Interactive platform for language learning with lessons, quizzes, and progress tracking.",
};

import { ExitModal } from "@/components/modals/exit-modal";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={font.className}>
        <Toaster position="top-center" richColors />
        <ExitModal />
        {children}
      </body>
    </html>
  );
}
