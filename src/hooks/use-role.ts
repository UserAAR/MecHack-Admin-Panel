"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ProfileRole } from "@/types/roles";

export function useProfileRole() {
  const [role, setRole] = useState<ProfileRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: u } = await supabase.auth.getUser();
        const user = u.user;
        if (!user) {
          if (mounted) setRole(null);
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (mounted) setRole((profile?.role as ProfileRole) || null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return { role, loading } as const;
} 