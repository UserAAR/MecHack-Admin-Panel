import "@/css/satoshi.css";
import "@/css/style.css";

import "flatpickr/dist/flatpickr.min.css";
import "jsvectormap/dist/jsvectormap.css";

import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import type { PropsWithChildren } from "react";
import { Providers } from "./providers";
import AppFrame from "./AppFrame";

export const metadata: Metadata = {
  title: {
    template: "%s | Mechack Admin Panel",
    default: "Mechack Admin Panel",
  },
  description: "Mechack Admin Panel for managing content, media, users and system settings.",
  icons: {
    icon: "/logo/logo.jpg",
    shortcut: "/logo/logo.jpg",
    apple: "/logo/logo.jpg",
  },
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <NextTopLoader color="#5750F1" showSpinner={false} />
          <AppFrame>{children}</AppFrame>
        </Providers>
      </body>
    </html>
  );
}
