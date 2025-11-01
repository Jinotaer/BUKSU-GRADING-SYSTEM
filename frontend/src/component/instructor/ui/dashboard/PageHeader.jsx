import React from "react";

export function PageHeader() {
  return (
    <div className="mb-8">
      <h1 className="pt-4 sm:pt-6 md:pt-4 lg:pt-6 font-outfit text-[#1E3A5F] text-2xl sm:text-3xl lg:text-4xl font-bold">
        Instructor Dashboard
      </h1>
      <p className="text-gray-600 mt-2">
        Welcome back! Here's an overview of your teaching activities.
      </p>
    </div>
  );
}
