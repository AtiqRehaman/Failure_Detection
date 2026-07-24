import React from 'react';

const FormInput = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  placeholder = '',
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
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
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

export default FormInput;
