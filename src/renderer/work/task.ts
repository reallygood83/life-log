import { WorkTask, TimerState, WorkLogCallbacks, WorkPriority } from '../../types';
import { formatDuration } from '../../parser/exercise';

export interface WorkTaskElements {
	taskEl: HTMLElement;
	timerEl: HTMLElement | null;
}

const PRIORITY_COLORS: Record<WorkPriority, string> = {
	high: '#E74C3C',
	medium: '#F39C12',
	low: '#3498DB'
};

const PRIORITY_LABELS: Record<WorkPriority, string> = {
	high: '높음',
	medium: '보통',
	low: '낮음'
};

export function renderWorkTask(
	container: HTMLElement,
	task: WorkTask,
	taskIndex: number,
	isActive: boolean,
	timerState: TimerState | null,
	callbacks: WorkLogCallbacks,
	workState: string
): WorkTaskElements {
	const taskEl = container.createDiv({
		cls: `work-task state-${task.state} priority-${task.priority} ${isActive ? 'active' : ''}`
	});

	const mainRow = taskEl.createDiv({ cls: 'work-task-main' });

	const iconEl = mainRow.createSpan({ cls: 'work-task-icon' });
	iconEl.textContent = getTaskIcon(task.state);

	const priorityIndicator = mainRow.createSpan({ cls: 'work-task-priority' });
	priorityIndicator.style.backgroundColor = PRIORITY_COLORS[task.priority];
	priorityIndicator.setAttribute('title', PRIORITY_LABELS[task.priority]);

	const nameEl = mainRow.createSpan({ cls: 'work-task-name' });
	nameEl.textContent = task.name;

	let timerEl: HTMLElement | null = null;

	if (task.notes) {
		const notesEl = mainRow.createSpan({ cls: 'work-task-notes' });
		notesEl.textContent = task.notes;
	}

	timerEl = mainRow.createDiv({ cls: 'work-task-timer-group' });
	
	if (task.state === 'completed' && task.actualDuration) {
		renderCompletedTimer(timerEl, task);
	} else if (isActive && timerState) {
		updateWorkTaskTimer(timerEl, timerState, task.expectedDuration);
	} else if (task.expectedDuration) {
		renderExpectedTimer(timerEl, task.expectedDuration);
	}

	if (isActive && workState === 'started') {
		renderTaskControls(taskEl, taskIndex, callbacks);
	}

	return { taskEl, timerEl };
}

function renderCompletedTimer(timerEl: HTMLElement, task: WorkTask): void {
	if (task.expectedDuration) {
		const expectedEl = timerEl.createSpan({ cls: 'work-timer-expected' });
		expectedEl.textContent = `예상: ${formatDurationHuman(task.expectedDuration)}`;
	}
	
	const actualEl = timerEl.createSpan({ cls: 'work-timer-actual' });
	actualEl.textContent = `실제: ${task.actualDuration}`;
	actualEl.createSpan({ cls: 'timer-indicator recorded', text: ' ✓' });
}

function renderExpectedTimer(timerEl: HTMLElement, expectedDuration: number): void {
	const expectedEl = timerEl.createSpan({ cls: 'work-timer-expected target' });
	expectedEl.textContent = `예상: [${formatDurationHuman(expectedDuration)}]`;
}

function renderTaskControls(
	taskEl: HTMLElement,
	taskIndex: number,
	callbacks: WorkLogCallbacks
): void {
	const controlsEl = taskEl.createDiv({ cls: 'work-task-controls' });

	const finishBtn = controlsEl.createEl('button', { cls: 'work-btn', text: '✓ 완료' });
	finishBtn.addEventListener('click', () => callbacks.onTaskFinish(taskIndex));

	const skipBtn = controlsEl.createEl('button', { cls: 'work-btn', text: '⏭ 건너뛰기' });
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

export function updateWorkTaskTimer(
	timerEl: HTMLElement,
	timerState: TimerState,
	expectedDuration?: number
): void {
	timerEl.empty();
	timerEl.classList.remove('overtime');

	if (expectedDuration !== undefined) {
		const expectedEl = timerEl.createSpan({ cls: 'work-timer-expected' });
		expectedEl.textContent = `예상: ${formatDurationHuman(expectedDuration)}`;
		
		const actualEl = timerEl.createSpan({ cls: 'work-timer-actual' });
		const isOvertime = timerState.exerciseElapsed > expectedDuration;
		
		if (isOvertime) {
			timerEl.classList.add('overtime');
			actualEl.textContent = `실제: ${formatDuration(timerState.exerciseElapsed)}`;
			actualEl.createSpan({ cls: 'timer-indicator overtime', text: ' !' });
		} else {
			actualEl.textContent = `실제: ${formatDuration(timerState.exerciseElapsed)}`;
			actualEl.createSpan({ cls: 'timer-indicator count-up', text: ' ▲' });
		}
	} else {
		const actualEl = timerEl.createSpan({ cls: 'work-timer-actual' });
		actualEl.textContent = formatDuration(timerState.exerciseElapsed);
		actualEl.createSpan({ cls: 'timer-indicator count-up', text: ' ▲' });
	}
}

function formatDurationHuman(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const mins = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;
	
	if (hours > 0) {
		if (mins === 0 && secs === 0) return `${hours}h`;
		if (secs === 0) return `${hours}h ${mins}m`;
		return `${hours}h ${mins}m`;
	}
	if (mins === 0) return `${secs}s`;
	if (secs === 0) return `${mins}m`;
	return `${mins}m ${secs}s`;
}
