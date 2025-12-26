import React from 'react';
import { NavLink } from 'react-router-dom';
import { CheckSquare, Layers, Archive, BarChart2, Info } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

interface NavItemProps {
    to: string;
    icon: React.ElementType;
    label: string;
}

import { motion } from 'framer-motion';

const NavItem = ({ to, icon: Icon, label }: NavItemProps) => (
    <NavLink
        to={to}
        className={() => cn(
            "relative flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors z-10",
            "text-zinc-400 hover:text-white"
        )}
    >
        {({ isActive }) => (
            <>
                {isActive && (
                    <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-zinc-800 rounded-md -z-10"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                )}
                <Icon size={18} className={cn("transition-colors", isActive && "text-blue-400")} />
                <span className={cn("transition-colors", isActive && "text-white")}>{label}</span>
            </>
        )}
    </NavLink>
);

import { useTasks } from '../hooks/useTasks';

// ... (previous imports)

export const Sidebar = () => {
    const { tasks } = useTasks();

    // Calculate daily progress
    // Filter for "Today" tasks (Category 'today' OR Inbox items i.e. no category & not done)
    const todayTasks = tasks.filter(t => t.category === 'today' || (!t.category && t.status !== 'DONE'));
    const totalTasks = todayTasks.length;
    const completedTasks = todayTasks.filter(t => t.status === 'DONE').length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return (
        <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col h-screen">
            {/* ... header ... */}
            <div className="p-4 pt-8 flex-1">
                {/* ... nav ... */}

                <div className="flex items-center gap-3 mb-8 px-2">
                    {/* ... logo ... */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-white/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <img
                            src="/logo.png"
                            alt="Logo"
                            className="w-10 h-10 rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.15)] object-cover relative z-10"
                        />
                    </div>
                    <span className="font-bold text-lg text-white tracking-tight">my.task</span>
                </div>

                <nav className="space-y-1">
                    <NavItem to="/" icon={CheckSquare} label="Tasks" />
                    <NavItem to="/projects" icon={Layers} label="Projects" />
                    <NavItem to="/analytics" icon={BarChart2} label="Analytics" />
                    <NavItem to="/archive" icon={Archive} label="Archive" />

                    <div className="pt-4 mt-4 border-t border-zinc-800">
                        <NavItem to="/about" icon={Info} label="About" />
                    </div>
                </nav>
            </div>

            {/* Daily Progress Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Daily Goal</div>
                        <div className="text-2xl font-bold text-white leading-none mt-1">{Math.round(progress)}%</div>
                    </div>
                    <div className="text-xs text-zinc-500 font-mono">
                        {completedTasks}/{totalTasks}
                    </div>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    />
                </div>
            </div>
        </aside>
    );
};
