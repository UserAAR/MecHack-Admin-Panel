import { redirect } from "next/navigation";

export default function LegacyProfileLayout() {
  redirect("/profiles");
  return null;
}
