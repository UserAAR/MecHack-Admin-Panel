import type { PropsWithChildren } from "react";
import ForceDarkTheme from "./ForceDarkTheme";

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#0b1220] via-[#0a1f3d] to-[#050b14] text-white">
      {/* Decorative blurred blobs */}
      <div aria-hidden className="pointer-events-none absolute -top-24 -left-24 h-[28rem] w-[28rem] rounded-full bg-primary/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-24 h-[32rem] w-[32rem] rounded-full bg-cyan-500/20 blur-[120px]" />

      <ForceDarkTheme>
        <div className="mx-auto flex min-h-screen max-w-screen-xl items-center justify-center p-6">
          <div className="w-full">{children}</div>
        </div>
      </ForceDarkTheme>
    </div>
  );
} 