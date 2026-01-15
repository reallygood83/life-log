import { ParsedStudyLog, StudyLogCallbacks, TimerState } from '../../types';
import { renderStudyHeader, updateStudyHeaderTimer, StudyHeaderElements } from './header';
import { renderStudyTask, updateStudyTaskTimer, StudyTaskElements } from './task';
import { renderStudyControls } from './controls';
import { TimerManager } from '../../timer/manager';
import { playTimerCompleteNotification } from '../../utils/notification';

export interface StudyRendererContext {
	el: HTMLElement;
	parsed: ParsedStudyLog;
	callbacks: StudyLogCallbacks;
	studyId: string;
	timerManager: TimerManager;
	enableTimerSound?: boolean;
	enableNotification?: boolean;
}

export function renderStudyLog(ctx: StudyRendererContext): void {
	const { el, parsed, callbacks, studyId, timerManager, enableTimerSound = true, enableNotification = false } = ctx;

	el.empty();

	const container = el.createDiv({
		cls: `study-container state-${parsed.metadata.state}`
	});

	const isTimerRunning = timerManager.isTimerRunning(studyId);
	const timerState = timerManager.getTimerState(studyId);
	const initialActiveIndex = isTimerRunning
		? timerManager.getActiveExerciseIndex(studyId)
		: -1;

	const headerElements = renderStudyHeader(
		container,
		parsed.metadata,
		timerState,
		isTimerRunning
	);

	if (parsed.tasks.length === 0 && parsed.metadata.state === 'planned') {
		renderEmptyStudyState(container);
		return;
	}

	const taskElements: StudyTaskElements[] = [];
	const tasksContainer = container.createDiv({ cls: 'study-tasks' });

	for (let i = 0; i < parsed.tasks.length; i++) {
		const task = parsed.tasks[i];
		if (!task) continue;

		const isActive = i === initialActiveIndex;
		const elements = renderStudyTask(
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

	renderStudyControls(container, parsed.metadata.state, callbacks, parsed);

	container.addEventListener('focusout', (e) => {
		const relatedTarget = e.relatedTarget as HTMLElement | null;
		if (!relatedTarget || !container.contains(relatedTarget)) {
			callbacks.onFlushChanges();
		}
	});

	if (isTimerRunning) {
		let lastKnownActiveIndex = initialActiveIndex;
		let hasAutoAdvanced = false;

		timerManager.subscribe(studyId, (state: TimerState) => {
			updateStudyHeaderTimer(headerElements.timerEl, state);

			const currentActiveIndex = timerManager.getActiveExerciseIndex(studyId);

			if (currentActiveIndex !== lastKnownActiveIndex) {
				return;
			}

			const activeElements = taskElements[currentActiveIndex];
			const activeTask = parsed.tasks[currentActiveIndex];

			if (activeElements?.timerEl && activeTask) {
				updateStudyTaskTimer(
					activeElements.timerEl,
					state,
					activeTask.targetDuration
				);

				if (!hasAutoAdvanced && activeTask.targetDuration !== undefined) {
					if (state.exerciseElapsed >= activeTask.targetDuration) {
						hasAutoAdvanced = true;
						playTimerCompleteNotification(
							{ enableSound: enableTimerSound, enableNotification: enableNotification },
							activeTask.name
						);
						callbacks.onTaskFinish(currentActiveIndex);
					}
				}
			}
		});
	}
}

function renderEmptyStudyState(container: HTMLElement): void {
	const emptyEl = container.createDiv({ cls: 'study-empty-state' });
	emptyEl.createDiv({
		cls: 'study-empty-message',
		text: '학습 항목이 없습니다. 코드블록에 항목을 추가해주세요.'
	});
}

export { renderStudyHeader, updateStudyHeaderTimer } from './header';
export { renderStudyTask, updateStudyTaskTimer } from './task';
export { renderStudyControls } from './controls';
