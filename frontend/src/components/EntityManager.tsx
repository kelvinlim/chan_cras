import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Loader2 } from 'lucide-react';
import { cn } from '../utils/utils';

interface Field {
    key: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select' | 'json' | 'checkbox';
    options?: { label: string; value: string }[];
    readOnly?: boolean;
    persistent?: boolean;
}

interface EntityManagerProps {
    title: string;
    fields: Field[];
    service: {
        list: () => Promise<any[]>;
        create: (data: any) => Promise<any>;
        update: (id: string, data: any) => Promise<any>;
        delete: (id: string) => Promise<any>;
    };
    onRefresh?: () => void;
}

const EntityManager: React.FC<EntityManagerProps> = ({ title, fields, service, onRefresh }) => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [formData, setFormData] = useState<any>({});
    const [searchTerm, setSearchTerm] = useState('');

    const fetchItems = async () => {
        setLoading(true);
        try {
            const data = await service.list();
            setItems(data);
        } catch (error) {
            console.error(`Failed to fetch ${title}:`, error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [service]);

    const handleOpenModal = (item: any | null = null) => {
        setEditingItem(item);
        if (item) {
            // Format dates for input[type="date"]
            const itemCopy = { ...item };
            fields.forEach(f => {
                if (f.type === 'date' && itemCopy[f.key]) {
                    itemCopy[f.key] = itemCopy[f.key].split('T')[0];
                }
            });
            setFormData(itemCopy);
        } else {
            const initialData: any = {};
            fields.forEach(f => {
                if (f.type === 'json') initialData[f.key] = {};
                else if (f.type === 'checkbox') initialData[f.key] = false;
                else if (f.persistent) {
                    const saved = localStorage.getItem(`sticky_${title.toLowerCase()}_${f.key}`);
                    initialData[f.key] = saved || '';
                }
                else initialData[f.key] = '';
            });
            setFormData(initialData);
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Filter formData to only include fields defined in 'fields'
            const payload: any = {};
            fields.forEach(f => {
                // Skip read-only fields like ref_code if you don't want them updated
                if (f.key === 'ref_code') return;

                let value = formData[f.key];

                // Convert empty strings to null for certain types
                if (value === '' && (f.type === 'date' || f.type === 'number' || f.type === 'select')) {
                    value = null;
                }

                payload[f.key] = value;
            });

            if (editingItem) {
                await service.update(editingItem.id, payload);
            } else {
                await service.create(payload);
                // Save persistent fields
                fields.forEach(f => {
                    if (f.persistent && formData[f.key]) {
                        localStorage.setItem(`sticky_${title.toLowerCase()}_${f.key}`, formData[f.key]);
                    }
                });
            }
            setIsModalOpen(false);
            fetchItems();
            onRefresh?.();
        } catch (error: any) {
            console.error(`Failed to save ${title}:`, error);
            const errorMsg = error.response?.data?.detail
                ? typeof error.response.data.detail === 'string'
                    ? error.response.data.detail
                    : JSON.stringify(error.response.data.detail)
                : error.message;
            alert(`Error saving ${title}: ${errorMsg}`);
        }
        finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(`Are you sure you want to delete this ${title.slice(0, -1)}?`)) return;
        setLoading(true);
        try {
            await service.delete(id);
            fetchItems();
            onRefresh?.();
        } catch (error) {
            console.error(`Failed to delete ${title}:`, error);
            alert(`Error deleting ${title}`);
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = items.filter(item =>
        Object.values(item).some(val =>
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={`Search ${title.toLowerCase()}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-hku-green focus:border-hku-green outline-none transition-all text-sm"
                    />
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-hku-green text-white rounded-lg hover:bg-opacity-90 transition-all font-semibold shadow-sm text-sm"
                >
                    <Plus className="w-4 h-4" /> Add {title.slice(0, -1)}
                </button>
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading && items.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center text-gray-400 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-hku-green" />
                        <p className="text-sm font-medium">Loading {title.toLowerCase()}...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    {fields.map(f => (
                                        <th key={f.key} className="px-6 py-4 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                                            {f.label}
                                        </th>
                                    ))}
                                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-gray-500 tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                        {fields.map(f => (
                                            <td key={f.key} className="px-6 py-4 text-sm text-gray-700">
                                                {f.type === 'json' ? (
                                                    <span className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                                                        {JSON.stringify(item[f.key]).slice(0, 30)}...
                                                    </span>
                                                ) : f.type === 'checkbox' ? (
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter",
                                                        item[f.key] ? "bg-hku-green/10 text-hku-green" : "bg-gray-100 text-gray-400"
                                                    )}>
                                                        {item[f.key] ? 'Active' : 'Inactive'}
                                                    </span>
                                                ) : f.type === 'select' ? (
                                                    f.options?.find(opt => opt.value === item[f.key])?.label || item[f.key]
                                                ) : item[f.key]}
                                            </td>
                                        ))}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenModal(item)}
                                                    className="p-1.5 text-gray-400 hover:text-hku-green hover:bg-hku-green/5 rounded transition-all"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-1.5 text-gray-400 hover:text-hku-error hover:bg-hku-error/5 rounded transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredItems.length === 0 && (
                                    <tr>
                                        <td colSpan={fields.length + 1} className="px-6 py-12 text-center text-gray-400 italic text-sm">
                                            No {title.toLowerCase()} found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-hku-green p-6 text-white flex items-center justify-between">
                            <h4 className="text-xl font-serif font-bold">{editingItem ? 'Edit' : 'Add'} {title.slice(0, -1)}</h4>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                                <Plus className="w-5 h-5 rotate-45" />
                            </button>
                        </div>
                        <form className="flex flex-col max-h-[85vh]" onSubmit={handleSave}>
                            <div className="p-8 space-y-4 overflow-y-auto flex-1">
                                {fields.map(f => {
                                    // Hide read-only fields during creation
                                    if (!editingItem && f.readOnly) return null;

                                    return (
                                        <div key={f.key} className="space-y-1.5">
                                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                                                {f.label}
                                            </label>
                                            {f.type === 'select' ? (
                                                <select
                                                    value={formData[f.key]}
                                                    onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                                                    disabled={f.readOnly && !!editingItem}
                                                    className={cn(
                                                        "w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-hku-green outline-none text-sm",
                                                        f.readOnly && "bg-gray-100 cursor-not-allowed opacity-75"
                                                    )}
                                                >
                                                    <option value="">Select Option</option>
                                                    {f.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                </select>
                                            ) : f.type === 'checkbox' ? (
                                                <div className="flex items-center gap-2 pt-1 border border-gray-100/50 p-3 rounded-lg bg-gray-50/30">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!formData[f.key]}
                                                        onChange={(e) => setFormData({ ...formData, [f.key]: e.target.checked })}
                                                        disabled={f.readOnly && !!editingItem}
                                                        className="w-5 h-5 accent-hku-green rounded border-gray-300 focus:ring-hku-green"
                                                    />
                                                    <span className="text-sm font-medium text-gray-700">{f.label}</span>
                                                </div>
                                            ) : f.type === 'json' ? (
                                                <textarea
                                                    value={typeof formData[f.key] === 'object' ? JSON.stringify(formData[f.key], null, 2) : formData[f.key]}
                                                    onChange={(e) => {
                                                        try {
                                                            const json = JSON.parse(e.target.value);
                                                            setFormData({ ...formData, [f.key]: json });
                                                        } catch {
                                                            setFormData({ ...formData, [f.key]: e.target.value });
                                                        }
                                                    }}
                                                    disabled={f.readOnly && !!editingItem}
                                                    rows={5}
                                                    className={cn(
                                                        "w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-hku-green outline-none text-sm font-mono",
                                                        f.readOnly && "bg-gray-100 cursor-not-allowed opacity-75"
                                                    )}
                                                    placeholder='{ "key": "value" }'
                                                />
                                            ) : (
                                                <input
                                                    type={f.type}
                                                    value={formData[f.key] || ''}
                                                    onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                                                    disabled={f.readOnly && !!editingItem}
                                                    className={cn(
                                                        "w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-hku-green outline-none text-sm",
                                                        f.readOnly && "bg-gray-100 cursor-not-allowed opacity-75"
                                                    )}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 transition-all font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-hku-green text-white rounded-lg hover:bg-opacity-90 transition-all font-semibold shadow-md flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    Save {title.slice(0, -1)}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EntityManager;
