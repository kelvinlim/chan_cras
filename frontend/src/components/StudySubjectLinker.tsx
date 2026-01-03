import React, { useState, useEffect } from 'react';
import { Link2, Unlink2, Search, Loader2, Users } from 'lucide-react';
import { studyService } from '../services/api';

interface StudySubjectLinkerProps {
    studies: any[];
    subjects: any[];
    onRefresh?: () => void;
}

const StudySubjectLinker: React.FC<StudySubjectLinkerProps> = ({ studies, subjects, onRefresh }) => {
    const [selectedStudyId, setSelectedStudyId] = useState<string>('');
    const [linkedSubjects, setLinkedSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchLinkedSubjects = async (studyId: string) => {
        if (!studyId) return;
        setLoading(true);
        try {
            const data = await studyService.listSubjects(studyId);
            setLinkedSubjects(data);
        } catch (error) {
            console.error("Failed to fetch linked subjects:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedStudyId) {
            fetchLinkedSubjects(selectedStudyId);
        } else {
            setLinkedSubjects([]);
        }
    }, [selectedStudyId]);

    const handleLink = async (subjectId: string) => {
        if (!selectedStudyId) return;
        try {
            await studyService.linkSubject(selectedStudyId, subjectId);
            fetchLinkedSubjects(selectedStudyId);
            onRefresh?.();
        } catch (error) {
            console.error("Link failed:", error);
        }
    };

    const handleUnlink = async (subjectId: string) => {
        if (!selectedStudyId) return;
        try {
            await studyService.unlinkSubject(selectedStudyId, subjectId);
            fetchLinkedSubjects(selectedStudyId);
            onRefresh?.();
        } catch (error) {
            console.error("Unlink failed:", error);
        }
    };

    const filteredSubjects = subjects.filter(s =>
        `${s.firstname} ${s.lastname} ${s.ref_code}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-0 animate-in fade-in duration-500">
            {/* Study Selection Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4 flex flex-col">
                <div className="flex items-center gap-2 text-hku-green mb-2">
                    <Users className="w-5 h-5" />
                    <h3 className="text-lg font-serif font-bold">Select Study</h3>
                </div>
                <div className="space-y-2 overflow-y-auto flex-1">
                    {studies.map(study => (
                        <button
                            key={study.id}
                            onClick={() => setSelectedStudyId(study.id)}
                            className={`w-full text-left p-4 rounded-lg border transition-all ${selectedStudyId === study.id
                                ? 'bg-hku-green/5 border-hku-green ring-1 ring-hku-green'
                                : 'bg-gray-50 border-gray-100 hover:border-hku-green/30'
                                }`}
                        >
                            <p className="font-bold text-sm text-gray-900">
                                {study.ref_code}: {study.title.substring(0, 20)}{study.title.length > 20 ? '...' : ''}
                            </p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Study identifier</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Subject Management Panel */}
            <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-serif font-bold text-gray-900">Manage Study Subjects</h3>
                        <p className="text-sm text-gray-500 mt-0.5">Link or unlink participants from the selected study</p>
                    </div>
                    <div className="relative max-w-xs w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search subjects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-hku-green outline-none text-sm"
                        />
                    </div>
                </div>

                {!selectedStudyId ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-12">
                        <Users className="w-12 h-12 mb-4 opacity-20" />
                        <p className="font-medium">Please select a study from the left panel</p>
                    </div>
                ) : loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-hku-green" />
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-2">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4">Subject</th>
                                    <th className="px-6 py-4">Ref Code</th>
                                    <th className="px-6 py-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredSubjects.map(subject => {
                                    const isLinked = linkedSubjects.some(ls => ls.id === subject.id);
                                    return (
                                        <tr key={subject.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{subject.firstname} {subject.lastname}</div>
                                            </td>
                                            <td className="px-6 py-4 text-[10px] font-mono text-gray-500">
                                                {subject.ref_code}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {isLinked ? (
                                                    <button
                                                        onClick={() => handleUnlink(subject.id)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-hku-error/10 text-hku-error rounded-full text-[10px] font-bold uppercase transition-all hover:bg-hku-error hover:text-white"
                                                    >
                                                        <Unlink2 className="w-3 h-3" /> Unlink
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleLink(subject.id)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-hku-green/10 text-hku-green rounded-full text-[10px] font-bold uppercase transition-all hover:bg-hku-green hover:text-white"
                                                    >
                                                        <Link2 className="w-3 h-3" /> Link
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudySubjectLinker;
