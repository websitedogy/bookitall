import type { Metadata } from "next";
import { SavedList } from "@/features/saved/saved-list";

export const metadata: Metadata = {
  title: "Saved",
  robots: { index: false, follow: false },
};

export default function SavedPage() {
  return <SavedList />;
}
