import { Github, Globe, History, Heart } from 'lucide-react';

export const AboutPage = () => {
    return (
        <div className="max-w-3xl mx-auto">
            <header className="mb-12 text-center">
                <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full" />
                    <img
                        src="/logo.png"
                        alt="Logo"
                        className="w-24 h-24 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)] object-cover relative z-10"
                    />
                </div>
                <h1 className="text-4xl font-bold mb-3">my.task</h1>
                <p className="text-xl text-zinc-400">The developer-centric task manager.</p>
                <div className="text-sm text-zinc-500 mt-2">Version 1.0.0</div>
            </header>

            <div className="space-y-12">
                {/* Author Section */}
                <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 hover:border-zinc-700 transition-colors">
                    <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <Heart size={18} className="text-red-500" />
                        Created by
                    </h2>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 border border-zinc-700">
                            <span className="font-bold text-xl">RD</span>
                        </div>
                        <div className="text-center sm:text-left">
                            <h3 className="text-xl font-bold text-white mb-1">Raziv DVX</h3>
                            <p className="text-zinc-400 text-sm mb-4">Full Stack Developer & UI/UX Enthusiast</p>

                            <div className="flex items-center gap-4 justify-center sm:justify-start">
                                <a
                                    href="https://github.com/Raziv-dvx/"
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors bg-zinc-800 px-3 py-1.5 rounded-md text-sm"
                                >
                                    <Github size={16} />
                                    GitHub
                                </a>
                                <a
                                    href="https://raziv.online"
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors bg-zinc-800 px-3 py-1.5 rounded-md text-sm"
                                >
                                    <Globe size={16} />
                                    Website
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Changelog Section */}
                <section>
                    <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <History size={18} />
                        Changelog
                    </h2>

                    <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-0 before:w-[2px] before:bg-zinc-800">
                        {/* v1.0.0 */}
                        <div className="relative pl-12">
                            <div className="absolute left-[13px] top-1.5 w-3.5 h-3.5 bg-blue-500 rounded-full border-4 border-[#1a1a1a]" />
                            <div className="mb-2">
                                <span className="text-white font-mono font-bold mr-3">v1.0.0</span>
                                <span className="text-zinc-500 text-sm">Initial Release</span>
                            </div>
                            <ul className="text-zinc-400 text-sm space-y-2 list-disc ml-4">
                                <li><strong>Task Management</strong>: Create, Organize, and Prioritize tasks with ease.</li>
                                <li><strong>Focus Mode</strong>: A dedicated, distraction-free timer to keep you in the flow.</li>
                                <li><strong>Projects</strong>: logical grouping for your development tasks.</li>
                                <li><strong>Analytics</strong>: Visualize your productivity with task completion and focus time charts.</li>
                                <li><strong>Archive</strong>: Automatically cleans up your workspace while keeping history safe.</li>
                                <li><strong>Visual Polish</strong>: Dark mode, smooth animations, and clean aesthetics.</li>
                            </ul>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};
