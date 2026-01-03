import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DynamicForm, { type FormSchema } from '../components/DynamicForm';

const mockSchema: FormSchema = {
    fields: [
        { name: 'full_name', type: 'text', label: 'Full Name', required: true }
    ]
};

describe('DynamicForm Basic', () => {
    it('renders label', () => {
        render(<DynamicForm schema={mockSchema} onSubmit={() => { }} />);
        expect(screen.getByText(/Full Name/i)).toBeInTheDocument();
    });
});
