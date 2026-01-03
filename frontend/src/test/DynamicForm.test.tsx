import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DynamicForm, { type FormSchema } from '../components/DynamicForm';

const mockSchema: FormSchema = {
    fields: [
        { name: 'full_name', type: 'text', label: 'Full Name', required: true },
        { name: 'age', type: 'number', label: 'Age' },
        { name: 'gender', type: 'select', label: 'Gender', options: ['Male', 'Female', 'Other'] }
    ]
};

describe('DynamicForm', () => {
    it('renders correctly based on schema', () => {
        render(<DynamicForm schema={mockSchema} onSubmit={() => { }} />);

        expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Age/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Gender/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Save Data/i })).toBeInTheDocument();
    });

    it('shows error message on empty required field', () => {
        render(<DynamicForm schema={mockSchema} onSubmit={() => { }} />);

        fireEvent.click(screen.getByRole('button', { name: /Save Data/i }));

        expect(screen.getByText(/Full Name is required/i)).toBeInTheDocument();
    });

    it('submits form data correctly', () => {
        const handleSubmit = vi.fn();
        render(<DynamicForm schema={mockSchema} onSubmit={handleSubmit} />);

        fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } });
        fireEvent.change(screen.getByLabelText(/Age/i), { target: { value: '30' } });
        fireEvent.change(screen.getByLabelText(/Gender/i), { target: { value: 'Male' } });

        fireEvent.click(screen.getByRole('button', { name: /Save Data/i }));

        expect(handleSubmit).toHaveBeenCalledWith({
            full_name: 'John Doe',
            age: 30,
            gender: 'Male'
        });
    });

    it('handles cancellation if onCancel is provided', () => {
        const handleCancel = vi.fn();
        render(<DynamicForm schema={mockSchema} onSubmit={() => { }} onCancel={handleCancel} />);

        fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

        expect(handleCancel).toHaveBeenCalled();
    });
});
