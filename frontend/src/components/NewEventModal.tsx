import React, { useState, useEffect } from 'react';
import { X, Save, Clock, Book, User, ClipboardList } from 'lucide-react';
import { format, addHours } from 'date-fns';
import { studyService, subjectService, procedureService, eventService } from '../services/api';

interface NewEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEventCreated?: () => void;
}

const NewEventModal: React.FC<NewEventModalProps> = ({ isOpen, onClose, onEventCreated }) => {
    // Selection state
    const [studies, setStudies] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [procedures, setProcedures] = useState<any[]>([]);

    const [studyId, setStudyId] = useState('');
    const [subjectId, setSubjectId] = useState('');
    const [procedureId, setProcedureId] = useState('');
    const [startTime, setStartTime] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    const [endTime, setEndTime] = useState(format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm"));

    const [loading, setLoading] = useState(false);

    // Initial Fetch
    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                try {
                    const [studiesData, subjectsData, proceduresData] = await Promise.all([
                        studyService.list(),
                        subjectService.list(),
                        procedureService.list()
                    ]);
                    setStudies(studiesData);
                    setSubjects(subjectsData);
                    setProcedures(proceduresData);

                    // Restore sticky if available
                    const savedStudy = localStorage.getItem('sticky_study');
                    const savedProcedure = localStorage.getItem('sticky_procedure');
                    if (savedStudy) setStudyId(savedStudy);
                    if (savedProcedure) setProcedureId(savedProcedure);
                } catch (error) {
                    console.error("Failed to fetch modal data:", error);
                }
            };
            fetchData();
        }
    }, [isOpen]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!studyId || !subjectId || !procedureId) {
            alert("Please select Study, Subject, and Procedure");
            return;
        }

        setLoading(true);
        try {
            await eventService.create({
                study_id: studyId,
                subject_id: subjectId,
                procedure_id: procedureId,
                start_datetime: new Date(startTime).toISOString(),
                end_datetime: new Date(endTime).toISOString(),
                status: 'pending'
            });

            // Update sticky
            localStorage.setItem('sticky_study', studyId);
            localStorage.setItem('sticky_procedure', procedureId);

            onEventCreated?.();
            onClose();
        } catch (error) {
            console.error("Failed to create event:", error);
            alert("Error creating event");
        } finally {
            setLoading(false);
        }
    };

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

                <form className="p-8 space-y-6" onSubmit={handleSave}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Study Selection */}
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center gap-1.5">
                                <Book className="w-3 h-3" /> Study
                            </label>
                            <select
                                value={studyId}
                                onChange={(e) => setStudyId(e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-hku-green focus:border-hku-green transition-all outline-none text-sm"
                                disabled={loading}
                            >
                                <option value="">Select Study</option>
                                {studies.map(s => <option key={s.id} value={s.id}>{s.name || s.ref_code}</option>)}
                            </select>
                        </div>

                        {/* Subject Selection */}
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center gap-1.5">
                                <User className="w-3 h-3" /> Subject
                            </label>
                            <select
                                value={subjectId}
                                onChange={(e) => setSubjectId(e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-hku-green focus:border-hku-green transition-all outline-none text-sm"
                                disabled={loading}
                            >
                                <option value="">Select Subject</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.lastname}, {s.firstname}</option>)}
                            </select>
                        </div>

                        {/* Procedure Selection */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center gap-1.5">
                                <ClipboardList className="w-3 h-3" /> Procedure
                            </label>
                            <select
                                value={procedureId}
                                onChange={(e) => setProcedureId(e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-hku-green focus:border-hku-green transition-all outline-none text-sm"
                                disabled={loading}
                            >
                                <option value="">Select Procedure</option>
                                {procedures.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>

                        {/* Date & Time */}
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center gap-1.5">
                                <Clock className="w-3 h-3" /> Start
                            </label>
                            <input
                                type="datetime-local"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-hku-green focus:border-hku-green outline-none text-sm"
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center gap-1.5">
                                <Clock className="w-3 h-3" /> End
                            </label>
                            <input
                                type="datetime-local"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-hku-green focus:border-hku-green outline-none text-sm"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all font-semibold"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-hku-green text-white rounded-xl hover:bg-opacity-90 transition-all font-semibold shadow-lg shadow-hku-green/20 flex items-center justify-center gap-2"
                            disabled={loading}
                        >
                            <Save className="w-5 h-5" /> {loading ? 'Saving...' : 'Schedule Event'}
                        </button>
                    </div>

                    <p className="text-center text-[10px] text-gray-400 italic">
                        Selections for Study and Procedure are persistent across sessions.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default NewEventModal;
