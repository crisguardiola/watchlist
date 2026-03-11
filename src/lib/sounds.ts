/**
 * Play a short "add to list" success sound using Web Audio API.
 * No external files required.
 */
export function playAddSound(): void {
	try {
		const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
		const now = audioContext.currentTime;

		// Quick ascending tone - pleasant "pop" feel
		const oscillator = audioContext.createOscillator();
		const gainNode = audioContext.createGain();

		oscillator.connect(gainNode);
		gainNode.connect(audioContext.destination);

		oscillator.frequency.setValueAtTime(523, now);
		oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.08);
		oscillator.type = 'sine';

		gainNode.gain.setValueAtTime(0.15, now);
		gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

		oscillator.start(now);
		oscillator.stop(now + 0.15);
	} catch {
		// Silently fail if audio is not supported or blocked
	}
}
