import { WorkMetadata, TimerState } from '../../types';
import { formatDuration } from '../../parser/exercise';

export interface WorkHeaderElements {
	titleEl: HTMLElement;
	timerEl: HTMLElement;
}

export function renderWorkHeader(
	container: HTMLElement,
	metadata: WorkMetadata,
	timerState: TimerState | null,
	isTimerRunning: boolean
): WorkHeaderElements {
	const headerEl = container.createDiv({ cls: 'work-header' });

	const topRow = headerEl.createDiv({ cls: 'work-header-top' });
	
	const titleEl = topRow.createDiv({ cls: 'work-title' });
	titleEl.createSpan({ cls: 'work-icon', text: '💼' });
	titleEl.createSpan({ cls: 'work-title-text', text: metadata.title || '업무' });

	const timerEl = topRow.createDiv({ cls: 'work-timer' });
	renderTimerContent(timerEl, metadata, timerState, isTimerRunning);

	if (metadata.tags && metadata.tags.length > 0) {
		const tagsEl = headerEl.createDiv({ cls: 'work-tags' });
		for (const tag of metadata.tags) {
			tagsEl.createSpan({ cls: 'work-tag', text: tag });
		}
	}

	return { titleEl, timerEl };
}

function renderTimerContent(
	timerEl: HTMLElement,
	metadata: WorkMetadata,
	timerState: TimerState | null,
	isTimerRunning: boolean
): void {
	if (metadata.state === 'completed' && metadata.totalDuration) {
		timerEl.createSpan({ cls: 'work-timer-value', text: metadata.totalDuration });
		timerEl.createSpan({ cls: 'work-timer-indicator recorded', text: ' ✓' });
	} else if (isTimerRunning && timerState) {
		timerEl.createSpan({ cls: 'work-timer-value', text: formatDuration(timerState.workoutElapsed) });
		timerEl.createSpan({ cls: 'work-timer-indicator count-up', text: ' ▲' });
	} else {
		timerEl.createSpan({ cls: 'work-timer-value', text: '--:--' });
	}
}

export function updateWorkHeaderTimer(
	timerEl: HTMLElement,
	timerState: TimerState
): void {
	timerEl.empty();
	timerEl.createSpan({ cls: 'work-timer-value', text: formatDuration(timerState.workoutElapsed) });
	timerEl.createSpan({ cls: 'work-timer-indicator count-up', text: ' ▲' });
}
