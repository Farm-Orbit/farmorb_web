import BarChartOne from "@/components/charts/bar/BarChartOne";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Next.js Bar Chart | FarmOrbit - Next.js Dashboard Template",
  description:
    "This is Next.js Bar Chart page for FarmOrbit - Next.js Tailwind CSS Admin Dashboard Template",
};

export default function page() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Bar Chart" />
      <div className="space-y-6">
        <ComponentCard title="Bar Chart 1">
          <Suspense fallback={<div>Loading chart...</div>}>
            <BarChartOne />
          </Suspense>
        </ComponentCard>
      </div>
    </div>
  );
}
