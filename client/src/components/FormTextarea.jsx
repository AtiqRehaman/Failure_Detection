import React from "react";

const FormTextarea = ({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  placeholder = "",
  rows = 4,
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
        <textarea
          id={id}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          rows={rows}
          required={required}
          className={`w-full px-4 py-3 bg-[#131c31] border rounded-2xl text-xs sm:text-sm text-white placeholder:text-[#52637c] focus:outline-none transition-all duration-200 resize-y ${
            hasError
              ? "border-red-500/80 focus:border-red-500 focus:ring-1 focus:ring-red-500/30"
              : "border-[#1e2c47] focus:border-[#00F5A0] focus:ring-1 focus:ring-[#00F5A0]"
          }`}
          {...props}
        />
      </div>

      {hasError && (
        <p className="text-[11px] font-medium text-red-400 mt-1 pl-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default FormTextarea;
