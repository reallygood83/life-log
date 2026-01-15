import { StudyTask, TimerState, StudyLogCallbacks } from '../../types';
import { formatDuration } from '../../parser/exercise';

export interface StudyTaskElements {
	taskEl: HTMLElement;
	timerEl: HTMLElement | null;
}

export function renderStudyTask(
	container: HTMLElement,
	task: StudyTask,
	taskIndex: number,
	isActive: boolean,
	timerState: TimerState | null,
	callbacks: StudyLogCallbacks,
	workoutState: string
): StudyTaskElements {
	const taskEl = container.createDiv({
		cls: `study-task state-${task.state} ${isActive ? 'active' : ''}`
	});

	const mainRow = taskEl.createDiv({ cls: 'study-task-main' });

	const iconEl = mainRow.createSpan({ cls: 'study-task-icon' });
	iconEl.textContent = getTaskIcon(task.state);

	const nameEl = mainRow.createSpan({ cls: 'study-task-name' });
	nameEl.textContent = task.name;

	let timerEl: HTMLElement | null = null;

	if (task.notes) {
		const notesEl = mainRow.createSpan({ cls: 'study-task-notes' });
		notesEl.textContent = task.notes;
	}

	timerEl = mainRow.createSpan({ cls: 'study-task-timer' });
	
	if (task.state === 'completed' && task.recordedDuration) {
		timerEl.textContent = task.recordedDuration;
		timerEl.createSpan({ cls: 'timer-indicator recorded', text: ' ✓' });
	} else if (isActive && timerState) {
		updateStudyTaskTimer(timerEl, timerState, task.targetDuration);
	} else if (task.targetDuration) {
		const mins = Math.floor(task.targetDuration / 60);
		const secs = task.targetDuration % 60;
		timerEl.textContent = `[${mins}m ${secs > 0 ? secs + 's' : ''}]`;
		timerEl.classList.add('target');
	}

	if (isActive && workoutState === 'started') {
		renderTaskControls(taskEl, taskIndex, callbacks);
	}

	return { taskEl, timerEl };
}

function renderTaskControls(
	taskEl: HTMLElement,
	taskIndex: number,
	callbacks: StudyLogCallbacks
): void {
	const controlsEl = taskEl.createDiv({ cls: 'study-task-controls' });

	const finishBtn = controlsEl.createEl('button', { cls: 'study-btn', text: '✓ 완료' });
	finishBtn.addEventListener('click', () => callbacks.onTaskFinish(taskIndex));

	const skipBtn = controlsEl.createEl('button', { cls: 'study-btn', text: '⏭ 건너뛰기' });
	skipBtn.addEventListener('click', () => callbacks.onTaskSkip(taskIndex));
}

function getTaskIcon(state: string): string {
	switch (state) {
		case 'completed': return '✓';
		case 'inProgress': return '▶';
		case 'skipped': return '–';
		default: return '○';
	}
}

export function updateStudyTaskTimer(
	timerEl: HTMLElement,
	timerState: TimerState,
	targetDuration?: number
): void {
	timerEl.empty();
	timerEl.classList.remove('overtime');

	if (targetDuration !== undefined) {
		const remaining = targetDuration - timerState.exerciseElapsed;
		const isOvertime = remaining < 0;

		if (isOvertime) {
			timerEl.classList.add('overtime');
			timerEl.textContent = `+${formatDuration(Math.abs(remaining))}`;
			timerEl.createSpan({ cls: 'timer-indicator overtime', text: ' !' });
		} else {
			timerEl.textContent = formatDuration(remaining);
			timerEl.createSpan({ cls: 'timer-indicator count-down', text: ' ▼' });
		}
	} else {
		timerEl.textContent = formatDuration(timerState.exerciseElapsed);
		timerEl.createSpan({ cls: 'timer-indicator count-up', text: ' ▲' });
	}
}
