import React from 'react';

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
  placeholder = 'Select an option',
  className = '',
  ...props
}) => {
  const hasError = touched && error;

  return (
    <div className={`mb-4 ${className}`}>
      <label htmlFor={id} className="form-label">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={`form-input ${hasError ? 'form-input-error' : ''}`}
        required={required}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hasError && (
        <p className="form-error-text">{error}</p>
      )}
    </div>
  );
};

export default FormSelect;
