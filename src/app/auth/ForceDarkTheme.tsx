"use client";
import { useEffect } from "react";
import { useTheme } from "next-themes";

export default function ForceDarkTheme({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme();
  useEffect(() => {
    setTheme("dark");
  }, [setTheme]);
  return <>{children}</>;
} 