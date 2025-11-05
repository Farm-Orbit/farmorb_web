import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import UserPasswordCard from "@/components/user-profile/UserPasswordCard";
import UserEmailCard from "@/components/user-profile/UserEmailCard";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Profile | FarmOrbit - Farm Management Platform",
  description:
    "Manage your profile information, password, and email settings in FarmOrbit",
};

export default function Profile() {
  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile Settings
        </h3>
        <div className="space-y-6">
          <UserMetaCard />
          <UserInfoCard />
          <UserEmailCard />
          <UserPasswordCard />
        </div>
      </div>
    </div>
  );
}
