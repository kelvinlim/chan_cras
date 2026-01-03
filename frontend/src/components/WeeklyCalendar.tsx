import React, { useState } from 'react';
import {
    startOfWeek,
    addDays,
    format,
    isSameDay,
    startOfDay,
    addHours,
    isToday,
    subWeeks,
    addWeeks
} from 'date-fns';
import { ChevronLeft, ChevronRight, Edit2, Eye, Users, Calendar as CalendarIcon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}


interface Event {
    id: string;
    title: string;
    subject: string;
    study: string;
    startTime: Date;
    endTime: Date;
    status: 'pending' | 'completed' | 'cancelled';
}

interface WeeklyCalendarProps {
    events: any[];
    lookups: {
        studies: any[];
        subjects: any[];
        procedures: any[];
    };
    onRefresh?: () => void;
    loading?: boolean;
}

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ events: backendEvents, lookups, onRefresh, loading }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM

    // Map backend events to internal format with lookup for names
    const events: Event[] = backendEvents.map(e => {
        const study = lookups.studies.find(s => s.id === e.study_id);
        const subject = lookups.subjects.find(s => s.id === e.subject_id);
        const procedure = lookups.procedures.find(p => p.id === e.procedure_id);

        return {
            id: e.id,
            title: procedure ? procedure.name : "Procedure Event",
            subject: subject ? `${subject.lastname}, ${subject.firstname}` : e.subject_id,
            study: study ? (study.name || study.ref_code) : e.study_id,
            startTime: new Date(e.start_datetime),
            endTime: e.end_datetime ? new Date(e.end_datetime) : addHours(new Date(e.start_datetime), 1),
            status: e.status
        };
    });

    const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
    const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
    const today = () => setCurrentDate(new Date());

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
            {/* Calendar Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-serif font-bold text-hku-green">
                        {format(weekStart, 'MMMM yyyy')}
                    </h3>
                    <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                        <button onClick={prevWeek} className="p-2 hover:bg-gray-50 border-r border-gray-100"><ChevronLeft className="w-4 h-4" /></button>
                        <button onClick={today} className="px-3 py-1 text-sm font-medium hover:bg-gray-50 border-r border-gray-100 uppercase tracking-tighter">Today</button>
                        <button onClick={nextWeek} className="p-2 hover:bg-gray-50"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                        <div className="w-2 h-2 rounded-full bg-hku-green"></div> Completed
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                        <div className="w-2 h-2 rounded-full bg-hku-warning"></div> Pending
                    </span>
                </div>
            </div>

            {/* Grid Header (Days) */}
            <div className="grid grid-cols-8 border-b border-gray-100 bg-white">
                <div className="p-4 border-r border-gray-100 text-center text-[10px] uppercase tracking-widest text-gray-400 font-bold">Time</div>
                {weekDays.map((day) => (
                    <div
                        key={day.toString()}
                        className={cn(
                            "p-4 border-r border-gray-100 text-center flex flex-col items-center justify-center gap-1",
                            isToday(day) && "bg-hku-green/5"
                        )}
                    >
                        <span className="text-[10px] uppercase font-bold text-gray-400 leading-none">{format(day, 'EEE')}</span>
                        <span className={cn(
                            "text-lg font-serif font-bold leading-none",
                            isToday(day) ? "text-hku-green" : "text-gray-700"
                        )}>
                            {format(day, 'd')}
                        </span>
                    </div>
                ))}
            </div>

            {/* Calendar Body (Hours) */}
            <div className="flex-1 overflow-auto relative bg-white">
                <div className="grid grid-cols-8 divide-x divide-gray-100">
                    {/* Time column */}
                    <div className="flex flex-col">
                        {hours.map((hour) => (
                            <div key={hour} className="h-20 p-2 border-b border-gray-50 text-[10px] text-gray-400 font-medium text-right uppercase">
                                {hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                            </div>
                        ))}
                    </div>

                    {/* Day columns */}
                    {weekDays.map((day) => (
                        <div key={day.toString()} className="flex flex-col h-full bg-gray-50/10 relative divide-y divide-gray-50">
                            {hours.map((hour) => (
                                <div key={hour} className="h-20 w-full relative group hover:bg-hku-green/[0.02]">
                                    {/* This is where events would be layered */}
                                </div>
                            ))}

                            {/* Event Layer */}
                            {events.filter(e => isSameDay(e.startTime, day)).map((event) => {
                                const startHour = event.startTime.getHours();
                                const startMin = event.startTime.getMinutes();
                                const duration = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60 * 60);
                                const top = (startHour - 8) * 80 + (startMin / 60) * 80;
                                const height = duration * 80;

                                return (
                                    <div
                                        key={event.id}
                                        onClick={() => setSelectedEvent(event)}
                                        style={{ top: `${top}px`, height: `${height}px` }}
                                        className={cn(
                                            "absolute left-1 right-1 rounded-lg p-2 shadow-sm border-l-4 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md z-10 overflow-hidden",
                                            event.status === 'completed'
                                                ? "bg-hku-green/10 border-hku-green text-hku-green"
                                                : "bg-hku-warning/10 border-hku-warning text-gray-800"
                                        )}
                                    >
                                        <p className="text-[10px] font-bold uppercase truncate">{event.study}</p>
                                        <p className="text-xs font-serif font-bold truncate leading-tight mt-0.5">{event.title}</p>
                                        <p className="text-[10px] truncate opacity-70 mt-1">{event.subject}</p>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Event Details Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-hku-green p-6 text-white relative">
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                            >
                                <ChevronRight className="w-6 h-6 rotate-90" />
                            </button>
                            <p className="text-xs uppercase tracking-widest font-bold text-white/70">{selectedEvent.study}</p>
                            <h4 className="text-2xl font-serif font-bold mt-1">{selectedEvent.title}</h4>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                    <Users className="w-5 h-5 text-hku-green" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-gray-400">Subject</p>
                                    <p className="font-medium text-gray-900">{selectedEvent.subject}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                    <CalendarIcon className="w-5 h-5 text-hku-green" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-gray-400">Scheduled Time</p>
                                    <p className="font-medium text-gray-900">
                                        {format(selectedEvent.startTime, 'MMM d, yyyy · HH:mm')} - {format(selectedEvent.endTime, 'HH:mm')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-hku-green text-white rounded-lg hover:bg-opacity-90 transition-all font-semibold shadow-sm">
                                    <Edit2 className="w-4 h-4" /> Edit Event
                                </button>
                                <button className="inline-flex items-center justify-center p-2.5 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-all">
                                    <Eye className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WeeklyCalendar;
