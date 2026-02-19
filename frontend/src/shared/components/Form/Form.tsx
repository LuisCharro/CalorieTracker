'use client';

import React from 'react';
import { Button } from '../Button';

// ============================================================================
// Types
// ============================================================================

export interface FormField {
  name: string;
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  autoComplete?: string;
  step?: number;
  min?: number;
  max?: number;
}

export interface FormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, string>) => void | Promise<void>;
  isSubmitting?: boolean;
  submitText?: string;
  submitVariant?: 'primary' | 'secondary' | 'outline';
  cancelText?: string;
  onCancel?: () => void;
  initialValues?: Record<string, string>;
  errors?: Record<string, string>;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export const Form: React.FC<FormProps> = ({
  fields,
  onSubmit,
  isSubmitting = false,
  submitText = 'Submit',
  submitVariant = 'primary',
  cancelText,
  onCancel,
  initialValues,
  errors = {},
  className = '',
}) => {
  const [values, setValues] = React.useState<Record<string, string>>(initialValues || {});
  const [touched, setTouched] = React.useState<Set<string>>(new Set());

  const handleChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (name: string) => {
    setTouched((prev) => new Set([...prev, name]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = new Set(fields.map((f) => f.name));
    setTouched(allTouched);

    await onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      {fields.map((field) => (
        <div key={field.name}>
          {field.label && (
            <label
              htmlFor={field.name}
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              {field.label}
              {field.required && <span className="ml-1 text-danger-500">*</span>}
            </label>
          )}

          <input
            id={field.name}
            type={field.type || 'text'}
            name={field.name}
            value={values[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            onBlur={() => handleBlur(field.name)}
            placeholder={field.placeholder}
            required={field.required}
            disabled={field.disabled || isSubmitting}
            autoComplete={field.autoComplete}
            step={field.step}
            min={field.min}
            max={field.max}
            className={`block w-full rounded-lg border px-4 py-2 text-base transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:border-neutral-200 disabled:bg-neutral-50 disabled:text-neutral-500 ${
              touched.has(field.name) && errors[field.name]
                ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20'
                : 'border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500'
            }`}
            aria-invalid={touched.has(field.name) && !!errors[field.name]}
          />

          {touched.has(field.name) && errors[field.name] && (
            <p className="mt-1 text-sm text-danger-600">{errors[field.name]}</p>
          )}

          {!errors[field.name] && field.helperText && (
            <p className="mt-1 text-sm text-neutral-500">{field.helperText}</p>
          )}
        </div>
      ))}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          variant={submitVariant}
          isLoading={isSubmitting}
          className="flex-1"
        >
          {submitText}
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            {cancelText}
          </Button>
        )}
      </div>
    </form>
  );
};

export default Form;
