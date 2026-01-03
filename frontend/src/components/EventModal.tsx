import React, { useState, useEffect } from 'react';
import { X, Save, Clock, Book, User, ClipboardList, Trash2, Play, CheckCircle } from 'lucide-react';
import { format, addHours } from 'date-fns';
import { studyService, procedureService, eventService } from '../services/api';
import { toUTC, fromUTC } from '../utils/timezone';
import DynamicForm from './DynamicForm';

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEventCreated?: () => void;
    onEventUpdated?: () => void;
    onEventDeleted?: () => void;
    timezone?: string;
    event?: any; // If provided, we are in Edit/View mode
}

const EventModal: React.FC<EventModalProps> = ({
    isOpen,
    onClose,
    onEventCreated,
    onEventUpdated,
    onEventDeleted,
    timezone = 'Asia/Hong_Kong',
    event
}) => {
    // Selection state
    const [studies, setStudies] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [procedures, setProcedures] = useState<any[]>([]);
    const [allProcedures, setAllProcedures] = useState<any[]>([]);

    const [studyId, setStudyId] = useState('');
    const [subjectId, setSubjectId] = useState('');
    const [procedureId, setProcedureId] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [status, setStatus] = useState('pending');
    const [notes, setNotes] = useState('');
    const [procedureData, setProcedureData] = useState<any>({});

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(false);
    const [fetchingRelated, setFetchingRelated] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);

    const isEditMode = !!event;

    // Initial Fetch & Setup
    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                setInitialLoading(true);
                try {
                    const [studiesData, proceduresData] = await Promise.all([
                        studyService.list(),
                        procedureService.list()
                    ]);
                    setStudies(studiesData);
                    setAllProcedures(proceduresData);

                    if (event) {
                        // Populate from event
                        setStudyId(event.study_id);
                        setSubjectId(event.subject_id);
                        setProcedureId(event.procedure_id);

                        // Convert dates back from UTC to local display
                        const localStart = fromUTC(event.start_datetime, timezone);
                        const localEnd = fromUTC(event.end_datetime, timezone);
                        setStartTime(format(localStart, "yyyy-MM-dd'T'HH:mm"));
                        setEndTime(format(localEnd, "yyyy-MM-dd'T'HH:mm"));

                        setStatus(event.status || 'pending');
                        setNotes(event.notes || '');
                        setProcedureData(event.procedure_data || {});
                    } else {
                        // Reset for New Mode
                        const savedStudy = localStorage.getItem('sticky_study');
                        if (savedStudy) setStudyId(savedStudy);

                        setSubjectId('');
                        setProcedureId('');
                        setStartTime(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
                        setEndTime(format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm"));
                        setStatus('pending');
                        setNotes('');
                        setProcedureData({});
                    }
                } catch (error) {
                    console.error("Failed to fetch modal data:", error);
                } finally {
                    setInitialLoading(false);
                }
            };
            fetchData();
        } else {
            // Reset local states when closing
            setIsExecuting(false);
        }
    }, [isOpen, event, timezone]);

    // Fetch Subjects when Study changes
    useEffect(() => {
        if (studyId && isOpen) {
            const fetchSubjects = async () => {
                setFetchingRelated(true);
                try {
                    const subjectsData = await studyService.listSubjects(studyId);
                    setSubjects(subjectsData);
                } catch (error) {
                    console.error("Failed to fetch subjects for study:", error);
                } finally {
                    setFetchingRelated(false);
                }
            };
            fetchSubjects();

            // Filter procedures
            const filteredProcs = allProcedures.filter(p => p.study_id === studyId);
            setProcedures(filteredProcs);
        } else {
            setSubjects([]);
            setProcedures([]);
        }

        // Only auto-reset if we are NOT in edit mode and the study actually changed
        if (!isEditMode && studyId && isOpen) {
            setSubjectId('');
            const savedProc = localStorage.getItem('sticky_procedure');
            if (savedProc && allProcedures.some(p => p.id === savedProc && p.study_id === studyId)) {
                setProcedureId(savedProc);
            } else {
                setProcedureId('');
            }
        }
    }, [studyId, allProcedures, isEditMode, isOpen]);

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!studyId || !subjectId || !procedureId) {
            alert("Please select Study, Subject, and Procedure");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                study_id: studyId,
                subject_id: subjectId,
                procedure_id: procedureId,
                start_datetime: toUTC(startTime, timezone),
                end_datetime: toUTC(endTime, timezone),
                status: status || 'pending',
                notes: notes,
                procedure_data: procedureData || {}
            };

            if (isEditMode) {
                await eventService.update(event.id, payload);
                onEventUpdated?.();
            } else {
                await eventService.create(payload);
                // Update sticky
                localStorage.setItem('sticky_study', studyId);
                localStorage.setItem('sticky_procedure', procedureId);
                onEventCreated?.();
            }
            onClose();
        } catch (error) {
            console.error("Failed to save event:", error);
            alert("Error saving event");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;

        setLoading(true);
        try {
            await eventService.delete(event.id);
            onEventDeleted?.();
            onClose();
        } catch (error) {
            console.error("Failed to delete event:", error);
            alert("Error deleting event");
        } finally {
            setLoading(false);
        }
    };

    const handleProcedureSubmit = async (data: any) => {
        setLoading(true);
        try {
            await eventService.update(event.id, {
                ...event,
                procedure_data: data,
                status: 'completed'
            });
            setProcedureData(data);
            setStatus('completed');
            onEventUpdated?.();
            setIsExecuting(false);
        } catch (error) {
            console.error("Failed to complete procedure:", error);
            alert("Error saving procedure data");
        } finally {
            setLoading(false);
        }
    };

    const getSelectedProcedure = () => {
        return allProcedures.find(p => p.id === procedureId);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="bg-hku-green p-6 text-white flex items-center justify-between shrink-0">
                    <div>
                        <h4 className="text-xl font-serif font-bold">
                            {isEditMode ? (isExecuting ? 'Execute Procedure' : 'Event Details') : 'Schedule New Event'}
                        </h4>
                        <p className="text-[10px] uppercase tracking-widest text-white/70 mt-1">Clinical Research Management System</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1">
                    {isExecuting ? (
                        <div className="p-8 animate-in slide-in-from-right duration-300">
                            {(() => {
                                const proc = getSelectedProcedure();
                                if (!proc || !proc.form_data_schema) {
                                    return <p className="text-sm text-gray-500 italic text-center py-12">No schema defined for this procedure.</p>;
                                }
                                return (
                                    <div className="space-y-6">
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                                                <ClipboardList className="w-5 h-5 text-hku-green" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-gray-400">Executing</p>
                                                <p className="font-semibold text-gray-900">{proc.name}</p>
                                            </div>
                                        </div>
                                        <DynamicForm
                                            schema={proc.form_data_schema}
                                            initialData={procedureData}
                                            onSubmit={handleProcedureSubmit}
                                            onCancel={() => setIsExecuting(false)}
                                        />
                                    </div>
                                );
                            })()}
                        </div>
                    ) : (
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
                                        disabled={loading || initialLoading || isEditMode}
                                    >
                                        <option value="">Select Study</option>
                                        {studies.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.ref_code}: {s.title.substring(0, 20)}{s.title.length > 20 ? '...' : ''}
                                            </option>
                                        ))}
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
                                        disabled={loading || initialLoading || isEditMode}
                                    >
                                        <option value="">Select Subject</option>
                                        {[...subjects].sort((a, b) => {
                                            const nameA = `${a.lastname}${a.firstname}`.toLowerCase();
                                            const nameB = `${b.lastname}${b.firstname}`.toLowerCase();
                                            return nameA.localeCompare(nameB);
                                        }).map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.lastname}, {s.firstname} ({s.ref_code})
                                            </option>
                                        ))}
                                    </select>
                                    {(fetchingRelated || initialLoading) && <p className="text-[9px] text-hku-green animate-pulse">Loading subjects...</p>}
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
                                        disabled={loading || initialLoading || isEditMode}
                                    >
                                        <option value="">Select Procedure</option>
                                        {[...procedures].sort((a, b) => a.name.localeCompare(b.name)).map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} ({p.ref_code})
                                            </option>
                                        ))}
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
                                        disabled={loading || status === 'completed'}
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

                                {/* Status Selection */}
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center gap-1.5">
                                        <ClipboardList className="w-3 h-3" /> Status
                                    </label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-hku-green focus:border-hku-green outline-none text-sm"
                                        disabled={loading}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="noshow">No Show</option>
                                    </select>
                                </div>

                                {/* Notes Field */}
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center gap-1.5">
                                        Notes
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Add any additional notes here (max 512 characters)..."
                                        maxLength={512}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-hku-green focus:border-hku-green outline-none text-sm min-h-[80px] resize-y"
                                        disabled={loading}
                                    />
                                    <p className="text-[9px] text-gray-400 text-right">{notes.length}/512 characters</p>
                                </div>
                            </div>

                            {status === 'completed' && getSelectedProcedure()?.form_data_schema && (
                                <div className="space-y-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsExecuting(true)}
                                        className="w-full px-4 py-2 border-2 border-hku-green text-hku-green rounded-xl hover:bg-hku-green/5 transition-all font-semibold text-sm flex items-center justify-center gap-2"
                                    >
                                        <Play className="w-4 h-4 fill-current" /> {Object.keys(procedureData).length > 0 ? 'Edit Procedure Data' : 'Record Procedure Data'}
                                    </button>
                                    {Object.keys(procedureData).length > 0 && (
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-2 flex items-center gap-2">
                                                <CheckCircle className="w-3 h-3 text-hku-green" /> Recorded Data summary
                                            </p>
                                            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                                                {Object.entries(procedureData).map(([key, val]) => (
                                                    <div key={key}>
                                                        <dt className="text-[10px] text-gray-500 font-medium">{key}</dt>
                                                        <dd className="text-sm text-gray-900">{String(val)}</dd>
                                                    </div>
                                                ))}
                                            </dl>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="pt-6 border-t border-gray-100 space-y-4">
                                <div className="flex gap-4">
                                    {isEditMode ? (
                                        <>
                                            <button
                                                type="submit"
                                                className="flex-1 px-4 py-3 bg-hku-green text-white rounded-xl hover:bg-opacity-90 transition-all font-semibold shadow-lg shadow-hku-green/20"
                                                disabled={loading || initialLoading}
                                            >
                                                {loading ? 'Saving...' : 'Save'}
                                            </button>
                                        </>
                                    ) : (
                                        <>
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
                                                disabled={loading || initialLoading}
                                            >
                                                <Save className="w-5 h-5" /> {loading ? 'Saving...' : 'Save'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {!isEditMode && (
                                <p className="text-center text-[10px] text-gray-400 italic">
                                    Selections for Study and Procedure are persistent across sessions.
                                </p>
                            )}
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventModal;
