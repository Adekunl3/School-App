import { redirect } from "next/navigation";

export default function Homepage() {
  // Redirect root to the sign-in page so the app shows login on mount
  redirect("/sign-in");
}