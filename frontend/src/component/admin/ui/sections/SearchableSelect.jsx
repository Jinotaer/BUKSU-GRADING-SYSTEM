import React, { useState, useRef, useEffect } from "react";
import { IconChevronDown, IconSearch, IconX } from "@tabler/icons-react";

export function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = "Select...",
  required = false,
  disabled = false,
  getOptionLabel,
  getOptionValue,
  name,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Filter options based on search term
  const filteredOptions = React.useMemo(() => {
    if (!searchTerm.trim()) return options;
    const term = searchTerm.toLowerCase();
    return options.filter((option) =>
      getOptionLabel(option).toLowerCase().includes(term)
    );
  }, [options, searchTerm, getOptionLabel]);

  // Get selected option
  const selectedOption = options.find(
    (option) => getOptionValue(option) === value
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (option) => {
    onChange({
      target: {
        name,
        value: getOptionValue(option),
      },
    });
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange({
      target: {
        name,
        value: "",
      },
    });
    setSearchTerm("");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main select button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-lg text-left flex items-center justify-between transition-all ${
          disabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : isOpen
            ? "border-blue-500 ring-2 ring-blue-500 ring-opacity-20"
            : "border-gray-300 hover:border-gray-400"
        } focus:outline-none`}
      >
        <span className={selectedOption ? "text-gray-900" : "text-gray-400"}>
          {selectedOption ? getOptionLabel(selectedOption) : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              <IconX size={16} className="text-gray-500" />
            </button>
          )}
          <IconChevronDown
            size={20}
            className={`text-gray-400 transition-transform ${
              isOpen ? "transform rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
          {/* Search input */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
            <div className="relative">
              <IconSearch
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="overflow-y-auto max-h-48">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => {
                const optionValue = getOptionValue(option);
                const isSelected = optionValue === value;
                return (
                  <button
                    key={optionValue || index}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`w-full px-4 py-2.5 text-left hover:bg-blue-50 transition-colors ${
                      isSelected
                        ? "bg-blue-100 text-blue-700 font-medium"
                        : "text-gray-900"
                    }`}
                  >
                    {getOptionLabel(option)}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                No results found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden input for form validation */}
      <input
        type="hidden"
        name={name}
        value={value || ""}
        required={required}
      />
    </div>
  );
}
