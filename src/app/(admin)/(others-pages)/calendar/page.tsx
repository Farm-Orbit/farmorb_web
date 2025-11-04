import Calendar from "@/components/calendar/Calendar";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Next.js Calender | FarmOrbit - Next.js Dashboard Template",
  description:
    "This is Next.js Calender page for FarmOrbit  Tailwind CSS Admin Dashboard Template",
  // other metadata
};
export default function page() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Calendar" />
      <Suspense fallback={<div>Loading calendar...</div>}>
        <Calendar />
      </Suspense>
    </div>
  );
}
