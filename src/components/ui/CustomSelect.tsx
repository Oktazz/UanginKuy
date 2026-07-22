"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface CustomSelectProps {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export function CustomSelect({ options, value, onChange, placeholder = "Pilih opsi..." }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-12 flex items-center justify-between px-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white
          ${isOpen ? "border-primary ring-2 ring-primary/20" : "border-gray-300 hover:border-gray-400"}
          ${!value ? "text-gray-500" : "text-gray-900"}
        `}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown size={20} className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <ul className="max-h-60 overflow-auto py-1">
            {options.map((option) => (
              <li
                key={option}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors
                  ${value === option ? "bg-primary/10 text-primary font-medium" : "text-gray-700 hover:bg-gray-50"}
                `}
              >
                <span className="truncate">{option}</span>
                {value === option && <Check size={16} className="text-primary" />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
