import { StudyMetadata, TimerState, TimerStyle } from '../../types';
import { formatDuration, formatDurationHuman } from '../../parser/exercise';
import { renderTimerByStyle } from '../timer/styles';

export interface StudyHeaderElements {
	titleEl: HTMLElement;
	timerEl: HTMLElement;
	scoresEl: HTMLElement;
}

export function renderStudyHeader(
	container: HTMLElement,
	metadata: StudyMetadata,
	timerState: TimerState | null,
	isTimerRunning: boolean,
	timerStyle: TimerStyle = 'digital'
): StudyHeaderElements {
	const headerEl = container.createDiv({ cls: 'study-header' });

	const topRow = headerEl.createDiv({ cls: 'study-header-top' });

	const titleEl = topRow.createDiv({ cls: 'study-title' });
	const subjectIcon = getSubjectIcon(metadata.subject);
	titleEl.createSpan({ cls: 'study-subject-icon', text: subjectIcon });
	titleEl.createSpan({ cls: 'study-subject-name', text: metadata.subject || '학습' });
	if (metadata.title) {
		titleEl.createSpan({ cls: 'study-title-text', text: ` - ${metadata.title}` });
	}

	const timerEl = topRow.createDiv({ cls: 'study-timer' });
	renderTimerContent(timerEl, metadata, timerState, isTimerRunning, timerStyle);

	const scoresEl = headerEl.createDiv({ cls: 'study-scores' });
	if (metadata.state === 'completed') {
		renderScores(scoresEl, metadata.focusScore, metadata.comprehensionScore);
	}

	if (metadata.tags && metadata.tags.length > 0) {
		const tagsEl = headerEl.createDiv({ cls: 'study-tags' });
		for (const tag of metadata.tags) {
			tagsEl.createSpan({ cls: 'study-tag', text: tag });
		}
	}

	return { titleEl, timerEl, scoresEl };
}

function renderTimerContent(
	timerEl: HTMLElement,
	metadata: StudyMetadata,
	timerState: TimerState | null,
	isTimerRunning: boolean,
	timerStyle: TimerStyle
): void {
	if (metadata.state === 'completed' && metadata.totalDuration) {
		timerEl.createSpan({ cls: 'study-timer-value', text: metadata.totalDuration });
		timerEl.createSpan({ cls: 'study-timer-indicator recorded', text: ' ✓' });
	} else if (isTimerRunning && timerState) {
		renderTimerByStyle(timerEl, timerState, timerStyle);
	} else {
		timerEl.createSpan({ cls: 'study-timer-value', text: '--:--' });
	}
}

function renderScores(container: HTMLElement, focusScore?: number, comprehensionScore?: number): void {
	if (focusScore) {
		const focusEl = container.createDiv({ cls: 'study-score-item' });
		focusEl.createSpan({ cls: 'study-score-label', text: '집중도: ' });
		renderStars(focusEl, focusScore);
	}

	if (comprehensionScore) {
		const compEl = container.createDiv({ cls: 'study-score-item' });
		compEl.createSpan({ cls: 'study-score-label', text: '이해도: ' });
		renderStars(compEl, comprehensionScore);
	}
}

function renderStars(container: HTMLElement, score: number): void {
	const starsContainer = container.createSpan({ cls: `study-stars score-${score}` });
	for (let i = 1; i <= 5; i++) {
		starsContainer.createSpan({
			cls: `study-star ${i <= score ? 'filled' : 'empty'}`,
			text: i <= score ? '★' : '☆'
		});
	}
}

function getSubjectIcon(subject: string): string {
	const iconMap: Record<string, string> = {
		'수학': '📐',
		'영어': '🔤',
		'프로그래밍': '💻',
		'독서': '📖',
		'기타': '📝',
	};
	return iconMap[subject] || '📚';
}

export function updateStudyHeaderTimer(
	timerEl: HTMLElement,
	timerState: TimerState,
	timerStyle: TimerStyle = 'digital'
): void {
	renderTimerByStyle(timerEl, timerState, timerStyle);
}
