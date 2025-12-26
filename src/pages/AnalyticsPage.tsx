import { useAnalytics } from '../hooks/useAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { CheckCircle, Clock, TrendingUp } from 'lucide-react';

export const AnalyticsPage = () => {
    const { stats, loading } = useAnalytics();

    if (loading) return <div>Loading...</div>;

    // Calculate totals
    const totalTasks = stats.reduce((acc, curr) => acc + curr.tasks_completed, 0);
    const totalFocus = stats.reduce((acc, curr) => acc + curr.total_focus_time, 0);
    const avgFocus = stats.length > 0 ? Math.round(totalFocus / stats.length) : 0;

    return (
        <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Analytics</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                            <CheckCircle size={20} />
                        </div>
                        <span className="text-zinc-400 font-medium">Tasks Completed</span>
                    </div>
                    <div className="text-4xl font-bold text-white pl-1">{totalTasks}</div>
                    <div className="text-xs text-zinc-500 mt-2 pl-1">All time</div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <Clock size={20} />
                        </div>
                        <span className="text-zinc-400 font-medium">Focus Time</span>
                    </div>
                    <div className="text-4xl font-bold text-white pl-1">{(totalFocus / 60).toFixed(1)}h</div>
                    <div className="text-xs text-zinc-500 mt-2 pl-1">{totalFocus} total minutes</div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-zinc-400 font-medium">Daily Average</span>
                    </div>
                    <div className="text-4xl font-bold text-white pl-1">{avgFocus}m</div>
                    <div className="text-xs text-zinc-500 mt-2 pl-1">Per day tracked</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl h-[350px]">
                    <h3 className="text-lg font-semibold mb-6">Tasks Completed</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="date" stroke="#666" fontSize={12} tickFormatter={(str) => str.slice(5)} />
                            <YAxis stroke="#666" fontSize={12} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Bar dataKey="tasks_completed" fill="#4ade80" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl h-[350px]">
                    <h3 className="text-lg font-semibold mb-6">Focus Minutes</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="date" stroke="#666" fontSize={12} tickFormatter={(str) => str.slice(5)} />
                            <YAxis stroke="#666" fontSize={12} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Line type="monotone" dataKey="total_focus_time" stroke="#60a5fa" strokeWidth={3} dot={{ fill: '#60a5fa', strokeWidth: 0 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
