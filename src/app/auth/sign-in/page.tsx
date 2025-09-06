import Signin from "@/components/Auth/Signin";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function SignIn() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold">Welcome Back</h1>
        <p className="mt-3 text-base text-dark-6">Sign in to your admin account</p>
      </div>

      <div className="relative w-full max-w-2xl rounded-3xl bg-white/5 p-10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] ring-1 ring-white/10 backdrop-blur-md">
        <div className="pointer-events-none absolute inset-x-0 -top-px mx-6 h-[2px] rounded-full bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0" />
        <Signin />
      </div>
    </div>
  );
}
