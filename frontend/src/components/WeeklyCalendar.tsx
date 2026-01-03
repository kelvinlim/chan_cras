import React, { useState, useEffect, useRef } from 'react';
import {
    format,
    startOfWeek,
    addDays,
    isSameDay,
    isToday,
    addHours
} from 'date-fns';
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    Plus
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { fromUTC, formatInTZ } from '../utils/timezone';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface Event {
    id: string;
    study_id: string;
    study: string;
    subject_id: string;
    subjectName: string;
    subjectRef: string;
    procedureName: string;
    procedureRef: string;
    startTime: Date;
    endTime: Date;
    status: string;
    notes: string;
    procedure_data: any;
}

interface WeeklyCalendarProps {
    events: any[];
    lookups: {
        studies: any[];
        subjects: any[];
        procedures: any[];
    };
    timezone?: string;
    onEventClick?: (event: any) => void;
    onAddEvent?: (date: Date) => void;
}

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
    events: backendEvents,
    lookups,
    timezone = 'Asia/Hong_Kong',
    onEventClick,
    onAddEvent
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to 8 AM on mount
    useEffect(() => {
        if (scrollContainerRef.current) {
            const hourHeight = 80;
            scrollContainerRef.current.scrollTop = 8 * hourHeight;
        }
    }, []);

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    // Convert backend events to local Date objects in target TZ
    const events: Event[] = backendEvents.map(e => {
        const study = lookups.studies.find(s => s.id === e.study_id);
        const subject = lookups.subjects.find(s => s.id === e.subject_id);
        const procedure = lookups.procedures.find(p => p.id === e.procedure_id);
        return {
            id: e.id,
            study_id: e.study_id,
            subject_id: e.subject_id,
            study: study
                ? `${study.ref_code}: ${study.title.substring(0, 20)}${study.title.length > 20 ? '...' : ''}`
                : e.study_id,
            subjectName: subject ? `${subject.lastname}, ${subject.firstname}` : 'Unknown',
            subjectRef: subject ? subject.ref_code : 'Unknown',
            procedureName: procedure ? procedure.name : 'Unknown',
            procedureRef: procedure ? procedure.ref_code : 'Unknown',
            procedure_id: e.procedure_id,
            startTime: fromUTC(e.start_datetime, timezone),
            endTime: e.end_datetime ? fromUTC(e.end_datetime, timezone) : addHours(fromUTC(e.start_datetime, timezone), 1),
            status: e.status,
            notes: e.notes || '',
            procedure_data: e.procedure_data
        };
    });

    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
        <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-4">
                    <h3 className="text-xl font-serif font-bold text-hku-green">
                        {format(weekStart, 'MMMM yyyy')}
                    </h3>
                    <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
                        <button
                            onClick={() => setCurrentDate(addDays(currentDate, -7))}
                            className="p-1.5 hover:bg-gray-50 rounded-md transition-colors text-gray-500"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setCurrentDate(new Date())}
                            className="px-3 py-1 text-xs font-bold text-hku-green hover:bg-hku-green/5 rounded-md transition-colors border-x border-gray-100"
                        >
                            Today
                        </button>
                        <button
                            onClick={() => setCurrentDate(addDays(currentDate, 7))}
                            className="p-1.5 hover:bg-gray-50 rounded-md transition-colors text-gray-500"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <button
                    onClick={() => onAddEvent?.(new Date())}
                    className="flex items-center gap-2 px-4 py-2 bg-hku-green text-white rounded-xl hover:bg-opacity-90 transition-all font-semibold shadow-lg shadow-hku-green/20 text-sm"
                >
                    <Plus className="w-4 h-4" /> New Event
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="flex flex-col flex-1 overflow-hidden relative">
                {/* Days Header */}
                <div className="flex border-b border-gray-100 bg-gray-50/30 sticky top-0 z-20">
                    <div className="w-20 shrink-0 border-r border-gray-100" />
                    {weekDays.map((day) => (
                        <div
                            key={day.toString()}
                            className={cn(
                                "flex-1 p-4 flex flex-col items-center gap-1 border-r border-gray-100 last:border-r-0",
                                isToday(day) && "bg-hku-green/5"
                            )}
                        >
                            <span className="text-[10px] uppercase font-bold text-gray-400 leading-none">{formatInTZ(day, timezone, { weekday: 'short' })}</span>
                            <span className={cn(
                                "text-lg font-serif font-bold leading-none",
                                isToday(day) ? "text-hku-green" : "text-gray-700"
                            )}>
                                {formatInTZ(day, timezone, { day: 'numeric' })}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Time Grid with Scroll */}
                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative custom-scrollbar">
                    {/* Time labels */}
                    <div className="absolute left-0 top-0 bottom-0 w-20 border-r border-gray-100 bg-gray-50/30 z-10">
                        {hours.map((hour) => (
                            <div key={hour} className="h-20 flex items-start justify-center pt-2 border-b border-gray-100/50">
                                <span className="text-[10px] font-bold text-gray-400 tabular-nums">
                                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Columns Panels */}
                    <div className="flex ml-20 h-[1920px]"> {/* 24 hours * 80px */}
                        {weekDays.map((day) => (
                            <div key={day.toString()} className="flex-1 relative border-r border-gray-50 last:border-r-0">
                                {/* Grid lines */}
                                {hours.map((h) => (
                                    <div key={h} className="h-20 border-b border-gray-50" />
                                ))}

                                {/* Events */}
                                {events.filter(e => isSameDay(e.startTime, day)).map(event => {
                                    const startHour = event.startTime.getHours();
                                    const startMin = event.startTime.getMinutes();
                                    const duration = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60 * 60);
                                    const top = startHour * 80 + (startMin / 60) * 80;
                                    const height = Math.max(duration * 80, 25);

                                    return (
                                        <div
                                            key={event.id}
                                            onClick={() => onEventClick?.(backendEvents.find(be => be.id === event.id))}
                                            style={{ top: `${top}px`, height: `${height}px` }}
                                            title={`Study: ${event.study}\nSubject: ${event.subjectName} (${event.subjectRef})\nProcedure: ${event.procedureName} (${event.procedureRef})\nTime: ${format(event.startTime, 'HH:mm')} - ${format(event.endTime, 'HH:mm')}${event.notes ? `\n\nNotes:\n${event.notes}` : ''}`}
                                            className={cn(
                                                "absolute left-1 right-1 rounded-lg p-2 shadow-sm border-l-4 cursor-pointer transition-all hover:scale-[1.02] hover:z-30 hover:shadow-xl z-20 overflow-hidden",
                                                event.status === 'completed' && "bg-hku-green/10 border-hku-green text-hku-green",
                                                (event.status === 'pending' || !event.status) && "bg-hku-warning/10 border-hku-warning text-hku-warning-dark",
                                                event.status === 'cancelled' && "bg-gray-100 border-gray-400 text-gray-500 opacity-60",
                                                event.status === 'noshow' && "bg-red-50 border-red-500 text-red-600"
                                            )}
                                        >
                                            <p className="text-[8px] font-bold uppercase truncate opacity-70 mb-0.5">{event.study}</p>
                                            <p className="text-[11px] font-serif font-bold truncate leading-tight mb-1">{event.procedureName}</p>
                                            <p className="text-[9px] font-medium opacity-80 truncate">{event.subjectRef}</p>
                                            {event.status === 'completed' && (
                                                <div className="absolute top-1 right-1">
                                                    <CheckCircle className="w-3 h-3 text-hku-green" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default WeeklyCalendar;
