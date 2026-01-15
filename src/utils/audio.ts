let audioContext: AudioContext | null = null;
let isInitialized = false;

export function initAudioContext(): void {
	if (isInitialized) return;
	
	try {
		audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
		
		if (audioContext.state === 'suspended') {
			audioContext.resume();
		}
		
		isInitialized = true;
		console.log('[Life Log] AudioContext initialized');
	} catch (e) {
		console.warn('[Life Log] Failed to initialize AudioContext:', e);
	}
}

export function playNotificationSound(type: 'complete' | 'break' | 'warning' = 'complete'): void {
	if (!audioContext) {
		initAudioContext();
	}
	
	if (!audioContext) {
		console.warn('[Life Log] AudioContext not available');
		return;
	}
	
	if (audioContext.state === 'suspended') {
		audioContext.resume();
	}
	
	try {
		switch (type) {
			case 'complete':
				playCompleteSound(audioContext);
				break;
			case 'break':
				playBreakSound(audioContext);
				break;
			case 'warning':
				playWarningSound(audioContext);
				break;
		}
	} catch (e) {
		console.warn('[Life Log] Failed to play sound:', e);
	}
}

function playCompleteSound(ctx: AudioContext): void {
	const now = ctx.currentTime;
	
	const osc1 = ctx.createOscillator();
	const gain1 = ctx.createGain();
	osc1.connect(gain1);
	gain1.connect(ctx.destination);
	osc1.frequency.value = 523.25;
	osc1.type = 'sine';
	gain1.gain.setValueAtTime(0.3, now);
	gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
	osc1.start(now);
	osc1.stop(now + 0.3);
	
	const osc2 = ctx.createOscillator();
	const gain2 = ctx.createGain();
	osc2.connect(gain2);
	gain2.connect(ctx.destination);
	osc2.frequency.value = 659.25;
	osc2.type = 'sine';
	gain2.gain.setValueAtTime(0.3, now + 0.15);
	gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
	osc2.start(now + 0.15);
	osc2.stop(now + 0.45);
	
	const osc3 = ctx.createOscillator();
	const gain3 = ctx.createGain();
	osc3.connect(gain3);
	gain3.connect(ctx.destination);
	osc3.frequency.value = 783.99;
	osc3.type = 'sine';
	gain3.gain.setValueAtTime(0.3, now + 0.3);
	gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
	osc3.start(now + 0.3);
	osc3.stop(now + 0.6);
}

function playBreakSound(ctx: AudioContext): void {
	const now = ctx.currentTime;
	
	const osc1 = ctx.createOscillator();
	const gain1 = ctx.createGain();
	osc1.connect(gain1);
	gain1.connect(ctx.destination);
	osc1.frequency.value = 440;
	osc1.type = 'sine';
	gain1.gain.setValueAtTime(0.2, now);
	gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
	osc1.start(now);
	osc1.stop(now + 0.5);
	
	const osc2 = ctx.createOscillator();
	const gain2 = ctx.createGain();
	osc2.connect(gain2);
	gain2.connect(ctx.destination);
	osc2.frequency.value = 349.23;
	osc2.type = 'sine';
	gain2.gain.setValueAtTime(0.2, now + 0.3);
	gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
	osc2.start(now + 0.3);
	osc2.stop(now + 0.8);
}

function playWarningSound(ctx: AudioContext): void {
	const now = ctx.currentTime;
	
	for (let i = 0; i < 3; i++) {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.frequency.value = 880;
		osc.type = 'square';
		gain.gain.setValueAtTime(0.15, now + i * 0.2);
		gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.2 + 0.1);
		osc.start(now + i * 0.2);
		osc.stop(now + i * 0.2 + 0.1);
	}
}

export function getAudioContext(): AudioContext | null {
	return audioContext;
}
