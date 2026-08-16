import React from "react";

const FormSelect = ({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  options = [],
  placeholder = "Select an option",
  className = "",
  ...props
}) => {
  const hasError = touched && error;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold uppercase tracking-wider text-white select-none"
        >
          {label}
          {required && <span className="text-[#00F5A0] ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          required={required}
          className={`w-full px-4 py-3 bg-[#131c31] border rounded-2xl text-xs sm:text-sm text-white placeholder:text-[#52637c] focus:outline-none transition-all duration-200 cursor-pointer appearance-none ${
            hasError
              ? "border-red-500/80 focus:border-red-500 focus:ring-1 focus:ring-red-500/30"
              : "border-[#1e2c47] focus:border-[#00F5A0] focus:ring-1 focus:ring-[#00F5A0]"
          }`}
          {...props}
        >
          <option value="" className="bg-[#080d19] text-[#6a7b95]">
            {placeholder}
          </option>
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-[#080d19] text-white py-1"
            >
              {option.label}
            </option>
          ))}
        </select>

        {/* Custom Chevron Indicator */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#52637c]">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {hasError && (
        <p className="text-[11px] font-medium text-red-400 mt-1 pl-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default FormSelect;
