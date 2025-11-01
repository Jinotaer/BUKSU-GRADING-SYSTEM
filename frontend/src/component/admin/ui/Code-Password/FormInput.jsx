import React from "react";

export function FormInput({ 
  label, 
  type = "text", 
  name, 
  id, 
  required = false,
  className = "",
  ...props 
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {label}
      </label>
      <input
        type={type}
        name={name}
        id={id}
        required={required}
        className={`w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${className}`}
        {...props}
      />
    </div>
  );
}
