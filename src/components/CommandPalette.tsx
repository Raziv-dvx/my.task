import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { Search, Plus, Calendar, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CommandPalette = () => {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm">
            <Command className="w-full max-w-lg overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center border-b border-zinc-800 px-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <Command.Input
                        placeholder="Type a command or search..."
                        className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>
                <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden py-2 px-2">
                    <Command.Empty className="py-6 text-center text-sm text-zinc-500">No results found.</Command.Empty>

                    <Command.Group heading="Navigation" className="px-2 py-1.5 text-xs font-medium text-zinc-500">
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/'))}
                            className="flex cursor-default select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none data-[selected=true]:bg-zinc-800 data-[selected=true]:text-zinc-50"
                        >
                            <Calendar className="mr-2 h-4 w-4" />
                            <span>Go to Tasks</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/projects'))}
                            className="flex cursor-default select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none data-[selected=true]:bg-zinc-800 data-[selected=true]:text-zinc-50"
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Go to Projects</span>
                        </Command.Item>
                    </Command.Group>

                    <Command.Group heading="Actions" className="px-2 py-1.5 text-xs font-medium text-zinc-500 mt-2">
                        <Command.Item
                            onSelect={() => runCommand(() => console.log('New Task'))}
                            className="flex cursor-default select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none data-[selected=true]:bg-zinc-800 data-[selected=true]:text-zinc-50"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            <span>Create New Task</span>
                            <span className="ml-auto text-xs tracking-widest text-zinc-500">Ctrl+N</span>
                        </Command.Item>
                    </Command.Group>
                </Command.List>
            </Command>
        </div>
    );
};
