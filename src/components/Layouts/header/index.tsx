"use client";

import { useProfileRole } from "@/hooks/use-role";
import { ThemeToggleSwitch } from "./theme-toggle";
import { UserInfo } from "./user-info";
import { usePathname } from "next/navigation";
import { useSidebarContext } from "../sidebar/sidebar-context";
import { MenuIcon } from "./icons";

function getPageMeta(pathname: string) {
  const map: Array<{ test: RegExp; title: string; subtitle?: string }> = [
    { test: /^\/$/, title: "Overview", subtitle: "Key metrics and quick insights" },
    { test: /^\/calendar/, title: "Calendar", subtitle: "Plan and track your schedule" },
    { test: /^\/content\/news/, title: "News", subtitle: "Create, edit and publish articles" },
    { test: /^\/content\/projects/, title: "Projects", subtitle: "Manage initiatives and milestones" },
    { test: /^\/content\/events/, title: "Events", subtitle: "Organize and promote upcoming events" },
    { test: /^\/media/, title: "Media Library", subtitle: "Upload and manage assets" },
    { test: /^\/users/, title: "Users", subtitle: "Access control and roles" },
    { test: /^\/forms/, title: "Forms", subtitle: "Examples and patterns" },
    { test: /^\/tables/, title: "Tables", subtitle: "Data views and lists" },
    { test: /^\/pages\/settings/, title: "Settings", subtitle: "Profile, security and preferences" },
    { test: /^\/profile/, title: "Profile", subtitle: "Your personal information" },
  ];
  for (const r of map) if (r.test.test(pathname)) return r;
  return { title: "Overview", subtitle: "Key metrics and quick insights" };
}

export function Header() {
  const { role, loading } = useProfileRole();
  const pathname = usePathname();
  const { toggleSidebar, isMobile } = useSidebarContext();
  if (loading) return null;
  if (role !== "admin" && role !== "superadmin") return null;

  const { title, subtitle } = getPageMeta(pathname || "/");

  return (
    <header className="sticky top-0 z-40 border-b border-stroke bg-white/90 backdrop-blur-sm dark:border-dark-3 dark:bg-gray-dark/80">
      <div className="flex items-center justify-between px-6 py-5 md:px-8 md:py-6">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="rounded-lg border px-2.5 py-2 text-dark hover:bg-gray-100 dark:border-dark-3 dark:text-white dark:hover:bg-[#FFFFFF1A] xl:hidden"
            aria-label="Toggle sidebar"
          >
            <MenuIcon />
          </button>

          <div className="max-xl:hidden">
            <h1 className="mb-1 text-2xl font-bold text-dark dark:text-white">{title}</h1>
            {subtitle && (
              <p className="text-sm text-dark-4 dark:text-dark-6">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <ThemeToggleSwitch />
          <UserInfo />
        </div>
      </div>
    </header>
  );
}
