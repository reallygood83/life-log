import { ParsedWorkLog, WorkLogCallbacks, TimerState } from '../../types';
import { renderWorkHeader, updateWorkHeaderTimer, WorkHeaderElements } from './header';
import { renderWorkTask, updateWorkTaskTimer, WorkTaskElements } from './task';
import { renderWorkControls } from './controls';
import { TimerManager } from '../../timer/manager';
import { playTimerCompleteNotification } from '../../utils/notification';

export interface WorkRendererContext {
	el: HTMLElement;
	parsed: ParsedWorkLog;
	callbacks: WorkLogCallbacks;
	workId: string;
	timerManager: TimerManager;
	enableTimerSound?: boolean;
	enableNotification?: boolean;
}

export function renderWorkLog(ctx: WorkRendererContext): void {
	const { el, parsed, callbacks, workId, timerManager, enableTimerSound = true, enableNotification = false } = ctx;

	el.empty();

	const container = el.createDiv({
		cls: `work-container state-${parsed.metadata.state}`
	});

	const isTimerRunning = timerManager.isTimerRunning(workId);
	const timerState = timerManager.getTimerState(workId);
	const initialActiveIndex = isTimerRunning
		? timerManager.getActiveExerciseIndex(workId)
		: -1;

	const headerElements = renderWorkHeader(
		container,
		parsed.metadata,
		timerState,
		isTimerRunning
	);

	if (parsed.tasks.length === 0 && parsed.metadata.state === 'planned') {
		renderEmptyWorkState(container);
		return;
	}

	const taskElements: WorkTaskElements[] = [];
	const tasksContainer = container.createDiv({ cls: 'work-tasks' });

	for (let i = 0; i < parsed.tasks.length; i++) {
		const task = parsed.tasks[i];
		if (!task) continue;

		const isActive = i === initialActiveIndex;
		const elements = renderWorkTask(
			tasksContainer,
			task,
			i,
			isActive,
			isActive ? timerState : null,
			callbacks,
			parsed.metadata.state
		);
		taskElements.push(elements);
	}

	renderWorkControls(container, parsed.metadata.state, callbacks, parsed);

	container.addEventListener('focusout', (e) => {
		const relatedTarget = e.relatedTarget as HTMLElement | null;
		if (!relatedTarget || !container.contains(relatedTarget)) {
			callbacks.onFlushChanges();
		}
	});

	if (isTimerRunning) {
		let lastKnownActiveIndex = initialActiveIndex;

		// Initial check to avoid playing sound immediately if already overtime upon load
		const initialTask = initialActiveIndex >= 0 ? parsed.tasks[initialActiveIndex] : null;
		let hasNotificationPlayed = (initialTask?.expectedDuration !== undefined && timerState)
			? timerState.exerciseElapsed >= initialTask.expectedDuration
			: false;

		timerManager.subscribe(workId, (state: TimerState) => {
			updateWorkHeaderTimer(headerElements.timerEl, state);

			const currentActiveIndex = timerManager.getActiveExerciseIndex(workId);

			if (currentActiveIndex !== lastKnownActiveIndex) {
				lastKnownActiveIndex = currentActiveIndex;
				// Reset notification flag for new task
				const newTask = parsed.tasks[currentActiveIndex];
				hasNotificationPlayed = (newTask?.expectedDuration !== undefined)
					? state.exerciseElapsed >= newTask.expectedDuration
					: false;
				return;
			}

			const activeElements = taskElements[currentActiveIndex];
			const activeTask = parsed.tasks[currentActiveIndex];

			if (activeElements?.timerEl && activeTask) {
				updateWorkTaskTimer(
					activeElements.timerEl,
					state,
					activeTask.expectedDuration
				);

				if (!hasNotificationPlayed && activeTask.expectedDuration !== undefined) {
					if (state.exerciseElapsed >= activeTask.expectedDuration) {
						hasNotificationPlayed = true;
						playTimerCompleteNotification(
							{ enableSound: enableTimerSound, enableNotification: enableNotification },
							activeTask.name
						);
					}
				}
			}
		});
	}
}

function renderEmptyWorkState(container: HTMLElement): void {
	const emptyEl = container.createDiv({ cls: 'work-empty-state' });
	emptyEl.createDiv({
		cls: 'work-empty-message',
		text: '업무 항목이 없습니다. 코드블록에 항목을 추가해주세요.'
	});
}

export { renderWorkHeader, updateWorkHeaderTimer } from './header';
export { renderWorkTask, updateWorkTaskTimer } from './task';
export { renderWorkControls } from './controls';
