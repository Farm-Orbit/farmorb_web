"use client";
import React from "react";
import Image from "next/image";
import { useAuth } from "../../hooks/useAuth";

export default function UserMetaCard() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-500 dark:text-gray-400">Loading user data...</p>
        </div>
      </div>
    );
  }

  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User';
  const initials = fullName
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
          <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            {user.avatar ? (
              <Image
                width={80}
                height={80}
                src={user.avatar}
                alt="user"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-semibold text-gray-600 dark:text-gray-300">
                {initials}
              </span>
            )}
          </div>
          <div className="order-3 xl:order-2">
            <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
              {fullName}
            </h4>
            <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user.auth_type === 'phone' ? 'Phone User' : 'Email User'}
              </p>
              <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}