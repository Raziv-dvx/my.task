import { useCallback } from 'react';

// Web Audio API based sound hook for clean, asset-free engagement

export const useSoundEffects = () => {
    const playSound = useCallback((type: 'pop' | 'success' | 'start' | 'stop') => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;

            if (type === 'pop') {
                // Short high blip
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
            } else if (type === 'success') {
                // Nice major chord aripeggio or bright bell
                osc.type = 'sine';
                osc.frequency.setValueAtTime(500, now);
                osc.frequency.linearRampToValueAtTime(1000, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);

                // Second tone for harmony
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.type = 'triangle';
                osc2.frequency.setValueAtTime(800, now);
                osc2.frequency.linearRampToValueAtTime(1500, now + 0.15);
                gain2.gain.setValueAtTime(0.05, now);
                gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                osc2.start(now + 0.05);
                osc2.stop(now + 0.5);
            } else if (type === 'start') {
                // Rising tone
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.linearRampToValueAtTime(600, now + 0.2);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
            } else if (type === 'stop') {
                // Falling tone
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.linearRampToValueAtTime(300, now + 0.2);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
            }

        } catch (e) {
            console.error("Audio play failed", e);
        }
    }, []);

    const playPop = () => playSound('pop');
    const playSuccess = () => playSound('success');
    const playStart = () => playSound('start');
    const playStop = () => playSound('stop');

    return { playPop, playSuccess, playStart, playStop };
};
