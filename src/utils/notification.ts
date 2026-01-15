import { playNotificationSound } from './audio';

export interface NotificationOptions {
	enableSound: boolean;
	enableNotification: boolean;
}

let lastNotificationTime = 0;
const NOTIFICATION_COOLDOWN = 3000;

export function playTimerCompleteNotification(
	options: NotificationOptions, 
	taskName?: string,
	soundType: 'complete' | 'break' | 'warning' = 'complete'
): void {
	const now = Date.now();
	if (now - lastNotificationTime < NOTIFICATION_COOLDOWN) {
		return;
	}
	lastNotificationTime = now;

	if (options.enableSound) {
		playNotificationSound(soundType);
	}

	if (options.enableNotification) {
		showSystemNotification(taskName, soundType);
	}
}

function showSystemNotification(taskName?: string, soundType?: string): void {
	if (!('Notification' in window)) {
		return;
	}

	if (Notification.permission === 'granted') {
		let body: string;
		if (soundType === 'break') {
			body = '휴식 시간이 끝났습니다! 다시 집중하세요.';
		} else if (taskName) {
			body = `"${taskName}" 완료!`;
		} else {
			body = '타이머가 완료되었습니다!';
		}
		
		new Notification('Life Log', {
			body,
			icon: undefined,
			silent: true
		});
	} else if (Notification.permission !== 'denied') {
		Notification.requestPermission();
	}
}
