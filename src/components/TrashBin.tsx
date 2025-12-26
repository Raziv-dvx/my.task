import { useDroppable } from '@dnd-kit/core';
import { Trash2 } from 'lucide-react';
import { clsx } from 'clsx';

export const TrashBin = () => {
    const { isOver, setNodeRef } = useDroppable({
        id: 'trash-bin',
        data: {
            type: 'trash'
        }
    });

    return (
        <div
            ref={setNodeRef}
            className={clsx(
                "fixed bottom-8 right-[320px] p-4 rounded-full transition-all duration-200 z-50",
                isOver ? "bg-red-500/20 text-red-500 scale-110" : "bg-[#1f1f1f] text-zinc-500 hover:text-red-400"
            )}
            title="Drop task to delete"
        >
            <Trash2 size={24} />
        </div>
    );
};
