import React from 'react';

const FormTextarea = ({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  placeholder = '',
  rows = 4,
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
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={rows}
        className={`form-input ${hasError ? 'form-input-error' : ''}`}
        required={required}
        {...props}
      />
      {hasError && (
        <p className="form-error-text">{error}</p>
      )}
    </div>
  );
};

export default FormTextarea;
