import React, { useState, useEffect } from 'react';
import { X, Save, Clock, Book, User, ClipboardList } from 'lucide-react';

interface NewEventModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const NewEventModal: React.FC<NewEventModalProps> = ({ isOpen, onClose }) => {
    // Sticky state from localStorage
    const [formData, setFormData] = useState({
        study: localStorage.getItem('last_study') || '',
        subject: localStorage.getItem('last_subject') || '',
        procedure: localStorage.getItem('last_procedure') || '',
        date: '',
        time: ''
    });

    // Persistence logic
    useEffect(() => {
        if (formData.study) localStorage.setItem('last_study', formData.study);
        if (formData.subject) localStorage.setItem('last_subject', formData.subject);
        if (formData.procedure) localStorage.setItem('last_procedure', formData.procedure);
    }, [formData.study, formData.subject, formData.procedure]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-hku-green p-6 text-white flex items-center justify-between">
                    <div>
                        <h4 className="text-xl font-serif font-bold">Schedule New Event</h4>
                        <p className="text-[10px] uppercase tracking-widest text-white/70 mt-1">Clinical Research Management System</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form className="p-8 space-y-6" onSubmit={(e) => { e.preventDefault(); onClose(); }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Study Selection (Sticky) */}
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center gap-1.5">
                                <Book className="w-3 h-3" /> Study
                            </label>
                            <select
                                value={formData.study}
                                onChange={(e) => setFormData({ ...formData, study: e.target.value })}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-hku-green focus:border-hku-green transition-all outline-none text-sm"
                            >
                                <option value="">Select Study</option>
                                <option value="S1">Neuro Study A</option>
                                <option value="S2">Diabetes Phase II</option>
                                <option value="S3">Cardio Screening</option>
                            </select>
                        </div>

                        {/* Subject Selection (Sticky) */}
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center gap-1.5">
                                <User className="w-3 h-3" /> Subject
                            </label>
                            <select
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-hku-green focus:border-hku-green transition-all outline-none text-sm"
                            >
                                <option value="">Select Subject</option>
                                <option value="SUB1">Chan Tai Man</option>
                                <option value="SUB2">Lee Siu Ming</option>
                                <option value="SUB3">Wong Ka Yee</option>
                            </select>
                        </div>

                        {/* Procedure Selection (Sticky) */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center gap-1.5">
                                <ClipboardList className="w-3 h-3" /> Procedure
                            </label>
                            <select
                                value={formData.procedure}
                                onChange={(e) => setFormData({ ...formData, procedure: e.target.value })}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-hku-green focus:border-hku-green transition-all outline-none text-sm"
                            >
                                <option value="">Select Procedure</option>
                                <option value="P1">MRI Scan</option>
                                <option value="P2">Blood Test</option>
                                <option value="P3">Consent Form</option>
                            </select>
                        </div>

                        {/* Date & Time */}
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center gap-1.5">
                                <Clock className="w-3 h-3" /> Date
                            </label>
                            <input
                                type="date"
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-hku-green focus:border-hku-green outline-none text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center gap-1.5">
                                <Clock className="w-3 h-3" /> Start Time
                            </label>
                            <input
                                type="time"
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-hku-green focus:border-hku-green outline-none text-sm"
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-hku-green text-white rounded-xl hover:bg-opacity-90 transition-all font-semibold shadow-lg shadow-hku-green/20 flex items-center justify-center gap-2"
                        >
                            <Save className="w-5 h-5" /> Schedule Event
                        </button>
                    </div>

                    <p className="text-center text-[10px] text-gray-400 italic">
                        Selections for Study, Subject, and Procedure are persistent across sessions.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default NewEventModal;
