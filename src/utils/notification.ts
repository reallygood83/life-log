export interface NotificationOptions {
	enableSound: boolean;
	enableNotification: boolean;
}

let lastNotificationTime = 0;
const NOTIFICATION_COOLDOWN = 3000;

export function playTimerCompleteNotification(options: NotificationOptions, taskName?: string): void {
	const now = Date.now();
	if (now - lastNotificationTime < NOTIFICATION_COOLDOWN) {
		return;
	}
	lastNotificationTime = now;

	if (options.enableSound) {
		playBeepSound();
	}

	if (options.enableNotification) {
		showSystemNotification(taskName);
	}
}

function playBeepSound(): void {
	try {
		const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
		
		const oscillator = audioContext.createOscillator();
		const gainNode = audioContext.createGain();
		
		oscillator.connect(gainNode);
		gainNode.connect(audioContext.destination);
		
		oscillator.frequency.value = 800;
		oscillator.type = 'sine';
		
		gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
		gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
		
		oscillator.start(audioContext.currentTime);
		oscillator.stop(audioContext.currentTime + 0.5);
		
		setTimeout(() => {
			const osc2 = audioContext.createOscillator();
			const gain2 = audioContext.createGain();
			osc2.connect(gain2);
			gain2.connect(audioContext.destination);
			osc2.frequency.value = 1000;
			osc2.type = 'sine';
			gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
			gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
			osc2.start(audioContext.currentTime);
			osc2.stop(audioContext.currentTime + 0.5);
		}, 200);
	} catch (e) {
		console.warn('[Life Log] Could not play notification sound:', e);
	}
}

function showSystemNotification(taskName?: string): void {
	if (!('Notification' in window)) {
		return;
	}

	if (Notification.permission === 'granted') {
		new Notification('Life Log', {
			body: taskName ? `"${taskName}" 시간이 완료되었습니다!` : '타이머가 완료되었습니다!',
			icon: undefined,
			silent: true
		});
	} else if (Notification.permission !== 'denied') {
		Notification.requestPermission();
	}
}
