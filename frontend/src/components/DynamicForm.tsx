import React, { useState, useEffect } from 'react';
import { cn } from '../utils/utils';

export interface FormField {
    name: string;
    type: 'text' | 'number' | 'date' | 'select';
    label: string;
    required?: boolean;
    options?: string[]; // For select type
    placeholder?: string;
}

export interface FormSchema {
    fields: FormField[];
}

interface DynamicFormProps {
    schema: FormSchema;
    initialData?: Record<string, any>;
    onSubmit: (data: Record<string, any>) => void;
    onCancel?: () => void;
    className?: string;
}

const DynamicForm: React.FC<DynamicFormProps> = ({
    schema,
    initialData = {},
    onSubmit,
    onCancel,
    className
}) => {
    const [formData, setFormData] = useState<Record<string, any>>(initialData);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Reset form when schema or initialData changes
    useEffect(() => {
        setFormData(initialData);
        setErrors({});
    }, [schema, initialData]);

    const handleChange = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        schema.fields.forEach(field => {
            if (field.required && !formData[field.name] && formData[field.name] !== 0) {
                newErrors[field.name] = `${field.label} is required`;
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
            <div className="grid grid-cols-1 gap-6">
                {schema.fields.map((field) => (
                    <div key={field.name} className="flex flex-col">
                        <label
                            htmlFor={field.name}
                            className="block text-sm font-medium text-slate-700 mb-1"
                        >
                            {field.label}
                            {field.required && <span className="text-hku-error ml-1">*</span>}
                        </label>

                        {field.type === 'select' ? (
                            <select
                                id={field.name}
                                value={formData[field.name] || ''}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                className={cn(
                                    "block w-full px-4 py-2 bg-white border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-hku-green focus:border-hku-green",
                                    errors[field.name] ? "border-hku-error" : "border-slate-300"
                                )}
                            >
                                <option value="">Select an option</option>
                                {field.options?.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                id={field.name}
                                type={field.type}
                                value={formData[field.name] || ''}
                                onChange={(e) => handleChange(field.name, field.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                                placeholder={field.placeholder}
                                className={cn(
                                    "block w-full px-4 py-2 bg-white border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-hku-green focus:border-hku-green",
                                    errors[field.name] ? "border-hku-error" : "border-slate-300"
                                )}
                            />
                        )}

                        {errors[field.name] && (
                            <p className="mt-1 text-xs text-hku-error">{errors[field.name]}</p>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-hku-green rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-hku-green shadow-sm transition-all"
                >
                    Save Data
                </button>
            </div>
        </form>
    );
};

export default DynamicForm;
