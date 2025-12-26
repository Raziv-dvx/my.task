import { useEffect } from 'react';

type KeyCombo = string; // e.g., 'ctrl+k', 'meta+enter'
type Handler = (e: KeyboardEvent) => void;

export const useKeyboardShortcut = (shortcuts: Record<KeyCombo, Handler>) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Build string representation of the pressed keys
            const modifiers = [];
            if (e.ctrlKey) modifiers.push('ctrl');
            if (e.metaKey) modifiers.push('meta'); // Command on Mac
            if (e.altKey) modifiers.push('alt');
            if (e.shiftKey) modifiers.push('shift');

            const key = e.key.toLowerCase();
            // Avoid firing if only modifiers are pressed
            if (['control', 'meta', 'alt', 'shift'].includes(key)) return;

            const combo = [...modifiers, key].join('+');

            if (shortcuts[combo]) {
                e.preventDefault();
                shortcuts[combo](e);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts]);
};
