import React, { useState, useEffect } from 'react';
import { settingsService } from '../services/api';
import { Globe, Info, RefreshCw } from 'lucide-react';

const SettingsManager: React.FC = () => {
    const [settings, setSettings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const data = await settingsService.list();
            setSettings(data);
        } catch (error) {
            console.error("Failed to fetch settings:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleUpdate = async (key: string, value: string) => {
        setSaving(key);
        try {
            await settingsService.update(key, value);
            // Update local state
            setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
        } catch (error) {
            console.error(`Failed to update setting ${key}:`, error);
            alert(`Failed to update ${key}`);
        } finally {
            setSaving(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 text-hku-green animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">System Settings</h1>
                <p className="text-gray-500">Manage global configuration for the CRAS platform.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-100">
                    {settings.map((setting) => (
                        <div key={setting.key} className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-gray-900 uppercase tracking-wider text-xs">{setting.key}</h3>
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-medium uppercase">
                                            {setting.category}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-4">{setting.description}</p>

                                    <div className="flex items-center gap-4">
                                        <div className="relative flex-1 max-w-md">
                                            {setting.key === 'DEFAULT_TIMEZONE' ? (
                                                <select
                                                    value={setting.value}
                                                    onChange={(e) => handleUpdate(setting.key, e.target.value)}
                                                    disabled={saving === setting.key}
                                                    className="w-full pl-3 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-hku-green/20 focus:border-hku-green outline-none appearance-none transition-all disabled:opacity-50"
                                                >
                                                    <option value="Asia/Hong_Kong">Asia/Hong_Kong (HKT)</option>
                                                    <option value="UTC">UTC (Universal Coordinated Time)</option>
                                                    <option value="America/New_York">America/New_York (EST/EDT)</option>
                                                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={setting.value}
                                                    onChange={(e) => {
                                                        const newValue = e.target.value;
                                                        setSettings(prev => prev.map(s => s.key === setting.key ? { ...s, value: newValue } : s));
                                                    }}
                                                    onBlur={(e) => handleUpdate(setting.key, e.target.value)}
                                                    disabled={saving === setting.key}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-hku-green/20 focus:border-hku-green outline-none transition-all disabled:opacity-50"
                                                />
                                            )}
                                            {saving === setting.key && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <RefreshCw className="w-4 h-4 text-hku-green animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-2 bg-hku-green/5 rounded-lg">
                                    {setting.key === 'DEFAULT_TIMEZONE' ? <Globe className="w-5 h-5 text-hku-green" /> : <Info className="w-5 h-5 text-hku-green" />}
                                </div>
                            </div>
                        </div>
                    ))}

                    {settings.length === 0 && (
                        <div className="p-12 text-center text-gray-500">
                            No settings found.
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 flex items-center gap-2 text-xs text-gray-400 bg-gray-50 p-4 rounded-lg">
                <Info className="w-4 h-4" />
                <span>Changes to these settings may affect all users and core system behavior. Only modify if you are certain.</span>
            </div>
        </div>
    );
};

export default SettingsManager;
