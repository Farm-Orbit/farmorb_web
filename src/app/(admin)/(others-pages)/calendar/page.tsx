import Calendar from "@/components/calendar/Calendar";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Calendar | FarmOrbit - Farm Management Platform",
  description: "View and manage your farm events and schedule with FarmOrbit calendar",
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
