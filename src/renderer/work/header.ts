import { WorkMetadata, TimerState, TimerStyle } from '../../types';
import { formatDuration } from '../../parser/exercise';
import { renderTimerByStyle } from '../timer/styles';

export interface WorkHeaderElements {
	titleEl: HTMLElement;
	timerEl: HTMLElement;
}

export function renderWorkHeader(
	container: HTMLElement,
	metadata: WorkMetadata,
	timerState: TimerState | null,
	isTimerRunning: boolean,
	timerStyle: TimerStyle = 'digital'
): WorkHeaderElements {
	const headerEl = container.createDiv({ cls: 'work-header' });

	const topRow = headerEl.createDiv({ cls: 'work-header-top' });

	const titleEl = topRow.createDiv({ cls: 'work-title' });
	titleEl.createSpan({ cls: 'work-icon', text: '💼' });
	titleEl.createSpan({ cls: 'work-title-text', text: metadata.title || '업무' });

	const timerEl = topRow.createDiv({ cls: 'work-timer' });
	renderTimerContent(timerEl, metadata, timerState, isTimerRunning, timerStyle);

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
	isTimerRunning: boolean,
	timerStyle: TimerStyle
): void {
	if (metadata.state === 'completed' && metadata.totalDuration) {
		timerEl.createSpan({ cls: 'work-timer-value', text: metadata.totalDuration });
		timerEl.createSpan({ cls: 'work-timer-indicator recorded', text: ' ✓' });
	} else if (isTimerRunning && timerState) {
		renderTimerByStyle(timerEl, timerState, timerStyle);
	} else {
		timerEl.createSpan({ cls: 'work-timer-value', text: '--:--' });
	}
}

export function updateWorkHeaderTimer(
	timerEl: HTMLElement,
	timerState: TimerState,
	timerStyle: TimerStyle = 'digital'
): void {
	renderTimerByStyle(timerEl, timerState, timerStyle);
}
