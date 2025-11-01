import React from "react";

export function FormHeader({ title, subtitle }) {
  return (
    <>
      <h2 className="font-bold text-center mb-2 text-gray-900 text-3xl">
        {title}
      </h2>
      <p className="text-center text-gray-600 text-sm mb-8">
        {subtitle}
      </p>
    </>
  );
}
