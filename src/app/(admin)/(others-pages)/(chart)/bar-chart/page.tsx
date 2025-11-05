import BarChartOne from "@/components/charts/bar/BarChartOne";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Bar Chart | FarmOrbit - Farm Management Platform",
  description: "View farm data and statistics with bar charts in FarmOrbit",
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
