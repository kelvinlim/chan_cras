import React from 'react';
import { User as UserIcon, LogOut, ChevronRight, Activity, Users, BookOpen, Calendar as CalendarIcon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface LayoutProps {
    children: React.ReactNode;
    onNewEvent?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onNewEvent }) => {
    const [sidebarOpen, setSidebarOpen] = React.useState(true);

    const menuItems = [
        { name: 'Dashboard', icon: Activity, href: '#' },
        { name: 'Studies', icon: BookOpen, href: '#' },
        { name: 'Subjects', icon: Users, href: '#' },
        { name: 'Calendar', icon: CalendarIcon, href: '#' },
    ];

    return (
        <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
            {/* Sidebar */}
            <aside
                className={cn(
                    "bg-hku-green text-white transition-all duration-300 flex flex-col shadow-xl",
                    sidebarOpen ? "w-64" : "w-20"
                )}
            >
                {/* Logo Section */}
                <div className="p-6 flex items-center gap-3 border-b border-white/10">
                    <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center shrink-0">
                        {/* Minimalist representation of HKU Shield */}
                        <span className="text-hku-green font-bold text-lg italic">HKU</span>
                    </div>
                    {sidebarOpen && (
                        <div className="flex flex-col">
                            <span className="font-serif font-bold text-lg leading-tight tracking-tight">CRAS</span>
                            <span className="text-[10px] uppercase tracking-widest text-white/70">Clinical Research</span>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-4 space-y-2">
                    {menuItems.map((item) => (
                        <a
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-4 p-3 rounded-lg hover:bg-white/10 transition-colors group relative",
                                !sidebarOpen && "justify-center"
                            )}
                        >
                            <item.icon className="w-6 h-6 shrink-0" />
                            {sidebarOpen && <span className="font-medium">{item.name}</span>}
                            {!sidebarOpen && (
                                <span className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                    {item.name}
                                </span>
                            )}
                        </a>
                    ))}
                </nav>

                {/* User / Footer */}
                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="w-full flex items-center justify-center p-2 hover:bg-white/10 rounded-lg transition-colors border border-white/20 mb-4"
                    >
                        <ChevronRight className={cn("w-5 h-5 transition-transform", sidebarOpen && "rotate-180")} />
                    </button>

                    <div className={cn("flex items-center gap-4 p-2", !sidebarOpen && "justify-center")}>
                        <div className="w-8 h-8 rounded-full bg-hku-warning flex items-center justify-center text-gray-900">
                            <UserIcon className="w-5 h-5" />
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">Kelvin Chan</p>
                                <p className="text-[10px] text-white/60 truncate italic">Principal Investigator</p>
                            </div>
                        )}
                        {sidebarOpen && <LogOut className="w-4 h-4 text-white/50 cursor-pointer hover:text-hku-error transition-colors" />}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm relative z-10">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-serif font-bold text-hku-green">Weekly Overview</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onNewEvent}
                            className="px-4 py-2 bg-hku-green text-white rounded-md hover:bg-opacity-90 transition-all font-medium text-sm shadow-sm"
                        >
                            New Event
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
