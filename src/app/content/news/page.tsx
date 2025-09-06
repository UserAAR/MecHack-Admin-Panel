import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { News } from "@/types/content";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui-elements/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NewsListPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = profile?.role as "user" | "admin" | "superadmin" | undefined;
  if (role !== "admin" && role !== "superadmin") redirect("/");

  const { data: news } = await supabase
    .from("news")
    .select("id, title, slug, published_at, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">News</h1>
        <Link
          href="/content/news/new"
          className={cn(
            buttonVariants({ variant: "primary", shape: "rounded", size: "small" }),
          )}
        >
          New Article
        </Link>
      </div>

      <div className="overflow-hidden rounded border border-gray-200 dark:border-dark-3">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-3">
          <thead className="bg-gray-50 dark:bg-dark-3">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium">Title</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Slug</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Status</th>
              <th className="px-4 py-2 text-right text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-dark-3">
            {(news as News[] | null)?.map((n) => (
              <tr key={n.id}>
                <td className="px-4 py-2">{n.title}</td>
                <td className="px-4 py-2">{n.slug}</td>
                <td className="px-4 py-2">
                  {n.published_at ? (
                    <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">Published</span>
                  ) : (
                    <span className="rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-700">Draft</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/content/news/${n.id}/edit`}
                      className={cn(buttonVariants({ variant: "outlineDark", shape: "rounded", size: "small" }))}
                    >
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 