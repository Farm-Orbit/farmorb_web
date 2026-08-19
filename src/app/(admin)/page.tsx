import type { Metadata } from "next";
import FarmList from "@/components/farms/FarmList";

export const metadata: Metadata = {
  title: "Your farms | FarmOrb",
  description: "Manage your farms, crops, livestock and operations with FarmOrb",
};

/**
 * The home page is the farm list.
 *
 * There used to be a dashboard here showing template e-commerce figures, and a
 * separate /farms route listing farms — two pages for one job, on top of a
 * switcher that already lists every farm. Landing straight on your farms means
 * the first thing you see is real, and someone with none is asked for the only
 * thing that unblocks the rest of the product.
 */
export default function HomePage() {
  return (
    <div className="p-4 md:p-6" data-testid="home-page">
      <FarmList />
    </div>
  );
}
