import { WorkoutMetadata, TimerState, TimerStyle } from '../types';
import { formatDuration, formatDurationHuman } from '../parser/exercise';
import { renderTimerByStyle } from './timer/styles';

export function renderHeader(
	container: HTMLElement,
	metadata: WorkoutMetadata,
	timerState: TimerState | null,
	isTimerRunning: boolean,
	timerStyle: TimerStyle = 'digital'
): { titleEl: HTMLElement; timerEl: HTMLElement } {
	const headerEl = container.createDiv({ cls: 'workout-header' });

	const titleEl = headerEl.createDiv({ cls: 'workout-title' });
	titleEl.textContent = metadata.title || 'Workout';

	// Display rest duration if defined
	if (metadata.restDuration) {
		const restDurationEl = headerEl.createDiv({ cls: 'workout-rest-duration' });
		const formattedRest = formatDurationHuman(metadata.restDuration);
		restDurationEl.setText(`Rest: ${formattedRest}`);
	}

	const timerContainer = headerEl.createDiv({ cls: 'workout-header-timer' });

	const timerEl = timerContainer.createSpan({ cls: 'workout-timer' });

	if (metadata.state === 'completed' && metadata.duration) {
		// Show recorded duration
		timerEl.textContent = metadata.duration;
		timerEl.createSpan({ cls: 'workout-timer-indicator recorded', text: ' ✓' });
	} else if (isTimerRunning && timerState) {
		// Show running timer
		renderTimerByStyle(timerEl, timerState, timerStyle);
	} else if (metadata.state === 'planned') {
		timerEl.textContent = '--:--';
	} else {
		timerEl.textContent = '--:--';
	}

	return { titleEl, timerEl };
}

export function updateHeaderTimer(
	timerEl: HTMLElement,
	timerState: TimerState,
	timerStyle: TimerStyle = 'digital'
): void {
	renderTimerByStyle(timerEl, timerState, timerStyle);
}
