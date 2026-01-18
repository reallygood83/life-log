import { Plugin, MarkdownPostProcessorContext, addIcon } from 'obsidian';
import { parseWorkout } from './parser';
import { serializeWorkout, updateParamValue, updateExerciseState, addSet, addRest, setRecordedDuration, lockAllFields, createSampleWorkout } from './serializer';
import { renderWorkout } from './renderer';
import { TimerManager } from './timer/manager';
import { FileUpdater } from './file/updater';
import { FileCreator } from './file/creator';
import { ParsedWorkout, WorkoutCallbacks, SectionInfo, LifeLogSettings, ParsedStudyLog, StudyLogCallbacks, ParsedWorkLog, WorkLogCallbacks, ParsedMealLog, MealLogCallbacks } from './types';
import { formatDurationHuman } from './parser/exercise';
import { parseStudyLog } from './parser/study';
import { serializeStudyLog, updateStudyTaskState, setStudyTaskDuration, setStudyScores } from './study-serializer';
import { renderStudyLog } from './renderer/study';
import { parseWorkLog } from './parser/work';
import { serializeWorkLog, updateWorkTaskState, setWorkTaskActualDuration } from './work-serializer';
import { renderWorkLog } from './renderer/work';
import { parseMealLog } from './parser/meal';
import { serializeMealLog, toggleFoodState, addFoodItem, removeFoodItem, setMealPhoto } from './meal-serializer';
import { renderMealLog } from './renderer/meal';
import { DEFAULT_SETTINGS, DEFAULT_SUBJECTS, DEFAULT_WORKOUT_TEMPLATES, DEFAULT_AI_SETTINGS, LifeLogSettingTab } from './settings';
import { QuickLogModal } from './modal/QuickLogModal';
import { SelfEvalModal } from './modal/SelfEvalModal';
import { AIAnalysisModal } from './ai/modals/AnalysisModal';

const LIFE_LOG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/><circle cx="12" cy="12" r="3"/></svg>`;

export default class LifeLogPlugin extends Plugin {
	private timerManager: TimerManager = new TimerManager();
	private fileUpdater: FileUpdater | null = null;
	private fileCreator: FileCreator | null = null;
	private ribbonIconEl: HTMLElement | null = null;
	settings: LifeLogSettings = DEFAULT_SETTINGS;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.fileUpdater = new FileUpdater(this.app);
		this.fileCreator = new FileCreator(this.app, this.settings);

		addIcon('life-log', LIFE_LOG_ICON);

		this.registerMarkdownCodeBlockProcessor('life-log', (source, el, ctx) => {
			this.processWorkoutBlock(source, el, ctx);
		});

		this.registerMarkdownCodeBlockProcessor('study-log', (source, el, ctx) => {
			this.processStudyBlock(source, el, ctx);
		});

		this.registerMarkdownCodeBlockProcessor('work-log', (source, el, ctx) => {
			this.processWorkBlock(source, el, ctx);
		});

		this.registerMarkdownCodeBlockProcessor('meal-log', (source, el, ctx) => {
			this.processMealBlock(source, el, ctx);
		});

		this.addCommand({
			id: 'open-quick-log',
			name: '새 기록',
			hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'l' }],
			callback: () => {
				if (this.fileCreator) {
					new QuickLogModal(this.app, this.settings, this.fileCreator).open();
				}
			}
		});

		this.addCommand({
			id: 'open-study-log',
			name: '새 학습 기록',
			callback: () => {
				if (this.fileCreator) {
					const modal = new QuickLogModal(this.app, { ...this.settings, defaultTab: 'study' }, this.fileCreator);
					modal.open();
				}
			}
		});

		this.addCommand({
			id: 'open-work-log',
			name: '새 업무 기록',
			callback: () => {
				if (this.fileCreator) {
					const modal = new QuickLogModal(this.app, { ...this.settings, defaultTab: 'work' }, this.fileCreator);
					modal.open();
				}
			}
		});

		this.addCommand({
			id: 'open-workout-log',
			name: '새 운동 기록',
			callback: () => {
				if (this.fileCreator) {
					const modal = new QuickLogModal(this.app, { ...this.settings, defaultTab: 'workout' }, this.fileCreator);
					modal.open();
				}
			}
		});

		this.addCommand({
			id: 'open-ai-analysis',
			name: 'AI 분석',
			hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'a' }],
			callback: () => {
				new AIAnalysisModal(
					this.app,
					this.settings.aiAnalysis,
					this.settings.logFolder
				).open();
			}
		});

		console.log('[Life Log] Registering settings tab...');
		this.addSettingTab(new LifeLogSettingTab(this.app, this));
		console.log('[Life Log] Settings tab registered');

		this.updateRibbonIcon();
	}

	onunload(): void {
		this.timerManager.destroy();
	}

	async loadSettings(): Promise<void> {
		const loaded = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, loaded);

		if (!this.settings.subjects || this.settings.subjects.length === 0) {
			this.settings.subjects = [...DEFAULT_SUBJECTS];
		}

		if (!this.settings.workoutTemplates || this.settings.workoutTemplates.length === 0) {
			this.settings.workoutTemplates = [...DEFAULT_WORKOUT_TEMPLATES];
		}

		// Ensure AI settings exist with defaults
		if (!this.settings.aiAnalysis) {
			this.settings.aiAnalysis = { ...DEFAULT_AI_SETTINGS };
		} else {
			this.settings.aiAnalysis = Object.assign({}, DEFAULT_AI_SETTINGS, this.settings.aiAnalysis);
		}
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		if (this.fileCreator) {
			this.fileCreator = new FileCreator(this.app, this.settings);
		}
	}

	updateRibbonIcon(): void {
		if (this.ribbonIconEl) {
			this.ribbonIconEl.remove();
			this.ribbonIconEl = null;
		}

		if (this.settings.showRibbonIcon) {
			this.ribbonIconEl = this.addRibbonIcon('life-log', 'Life Log: 새 기록', () => {
				if (this.fileCreator) {
					new QuickLogModal(this.app, this.settings, this.fileCreator).open();
				}
			});
		}
	}

	private processWorkoutBlock(
		source: string,
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext
	): void {
		const parsed = parseWorkout(source);
		const sectionInfo = ctx.getSectionInfo(el) as SectionInfo | null;
		const workoutId = `${ctx.sourcePath}:${sectionInfo?.lineStart ?? 0}`;

		const isTimerRunning = this.timerManager.isTimerRunning(workoutId);
		if (isTimerRunning && parsed.metadata.state !== 'started') {
			this.timerManager.stopWorkoutTimer(workoutId);
		} else if (isTimerRunning && parsed.metadata.state === 'started') {
			const parsedActiveIndex = parsed.exercises.findIndex(e => e.state === 'inProgress');
			const timerActiveIndex = this.timerManager.getActiveExerciseIndex(workoutId);
			if (parsedActiveIndex >= 0 && parsedActiveIndex !== timerActiveIndex) {
				this.timerManager.setActiveExerciseIndex(workoutId, parsedActiveIndex);
			}
		}

		const callbacks = this.createWorkoutCallbacks(ctx, sectionInfo, parsed, workoutId);

		const timerStyle = this.settings.usePerTypeTimerStyle
			? this.settings.workoutTimerStyle
			: this.settings.timerStyle;

		renderWorkout({
			el,
			parsed,
			callbacks,
			workoutId,
			timerManager: this.timerManager,
			timerStyle
		});
	}

	private processStudyBlock(
		source: string,
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext
	): void {
		const parsed = parseStudyLog(source);
		const sectionInfo = ctx.getSectionInfo(el) as SectionInfo | null;
		const studyId = `study:${ctx.sourcePath}:${sectionInfo?.lineStart ?? 0}`;

		const isTimerRunning = this.timerManager.isTimerRunning(studyId);
		if (isTimerRunning && parsed.metadata.state !== 'started') {
			this.timerManager.stopWorkoutTimer(studyId);
		} else if (isTimerRunning && parsed.metadata.state === 'started') {
			const parsedActiveIndex = parsed.tasks.findIndex(t => t.state === 'inProgress');
			const timerActiveIndex = this.timerManager.getActiveExerciseIndex(studyId);
			if (parsedActiveIndex >= 0 && parsedActiveIndex !== timerActiveIndex) {
				this.timerManager.setActiveExerciseIndex(studyId, parsedActiveIndex);
			}
		}

		const callbacks = this.createStudyCallbacks(ctx, sectionInfo, parsed, studyId);

		const timerStyle = this.settings.usePerTypeTimerStyle
			? this.settings.studyTimerStyle
			: this.settings.timerStyle;

		renderStudyLog({
			el,
			parsed,
			callbacks,
			studyId,
			timerManager: this.timerManager,
			enableTimerSound: this.settings.enableTimerSound,
			enableNotification: this.settings.enableNotifications,
			timerStyle
		});
	}

	private processWorkBlock(
		source: string,
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext
	): void {
		const parsed = parseWorkLog(source);
		const sectionInfo = ctx.getSectionInfo(el) as SectionInfo | null;
		const workId = `work:${ctx.sourcePath}:${sectionInfo?.lineStart ?? 0}`;

		const isTimerRunning = this.timerManager.isTimerRunning(workId);
		if (isTimerRunning && parsed.metadata.state !== 'started') {
			this.timerManager.stopWorkoutTimer(workId);
		} else if (isTimerRunning && parsed.metadata.state === 'started') {
			const parsedActiveIndex = parsed.tasks.findIndex(t => t.state === 'inProgress');
			const timerActiveIndex = this.timerManager.getActiveExerciseIndex(workId);
			if (parsedActiveIndex >= 0 && parsedActiveIndex !== timerActiveIndex) {
				this.timerManager.setActiveExerciseIndex(workId, parsedActiveIndex);
			}
		}

		const callbacks = this.createWorkCallbacks(ctx, sectionInfo, parsed, workId);

		const timerStyle = this.settings.usePerTypeTimerStyle
			? this.settings.workTimerStyle
			: this.settings.timerStyle;

		renderWorkLog({
			el,
			parsed,
			callbacks,
			workId,
			timerManager: this.timerManager,
			enableTimerSound: this.settings.enableTimerSound,
			enableNotification: this.settings.enableNotifications,
			timerStyle
		});
	}

	private createWorkCallbacks(
		ctx: MarkdownPostProcessorContext,
		sectionInfo: SectionInfo | null,
		parsed: ParsedWorkLog,
		workId: string
	): WorkLogCallbacks {
		let currentParsed = parsed;
		let hasPendingChanges = false;

		const updateFile = async (newParsed: ParsedWorkLog): Promise<void> => {
			currentParsed = newParsed;
			hasPendingChanges = false;
			const newContent = serializeWorkLog(newParsed);
			const expectedTitle = currentParsed.metadata.title;
			await this.fileUpdater?.updateCodeBlock(ctx.sourcePath, sectionInfo, newContent, expectedTitle);
		};

		const flushChanges = async (): Promise<void> => {
			if (hasPendingChanges) {
				await updateFile(currentParsed);
			}
		};

		return {
			onStartWork: async (): Promise<void> => {
				hasPendingChanges = false;
				currentParsed.metadata.state = 'started';
				currentParsed.metadata.startDate = this.formatStartDate(new Date());

				const firstPending = currentParsed.tasks.findIndex(t => t.state === 'pending');
				if (firstPending >= 0) {
					currentParsed = updateWorkTaskState(currentParsed, firstPending, 'inProgress');
				}

				await updateFile(currentParsed);
				this.timerManager.startWorkoutTimer(workId, firstPending >= 0 ? firstPending : 0);
			},

			onFinishWork: async (): Promise<void> => {
				const timerState = this.timerManager.getTimerState(workId);
				if (timerState) {
					currentParsed.metadata.totalDuration = formatDurationHuman(timerState.workoutElapsed);
				}
				currentParsed.metadata.endDate = this.formatStartDate(new Date());
				currentParsed.metadata.state = 'completed';

				for (let i = 0; i < currentParsed.tasks.length; i++) {
					const task = currentParsed.tasks[i];
					if (task && task.state === 'inProgress') {
						const ts = this.timerManager.getTimerState(workId);
						if (ts) {
							currentParsed = setWorkTaskActualDuration(currentParsed, i, formatDurationHuman(ts.exerciseElapsed));
						}
						currentParsed = updateWorkTaskState(currentParsed, i, 'completed');
					}
				}

				await updateFile(currentParsed);
				this.timerManager.stopWorkoutTimer(workId);
			},

			onTaskFinish: async (taskIndex: number): Promise<void> => {
				hasPendingChanges = false;
				const task = currentParsed.tasks[taskIndex];
				if (!task) return;

				const timerState = this.timerManager.getTimerState(workId);
				if (timerState) {
					currentParsed = setWorkTaskActualDuration(
						currentParsed,
						taskIndex,
						formatDurationHuman(timerState.exerciseElapsed)
					);
				}

				currentParsed = updateWorkTaskState(currentParsed, taskIndex, 'completed');

				const nextPending = currentParsed.tasks.findIndex(
					(t, i) => i > taskIndex && t.state === 'pending'
				);

				if (nextPending >= 0) {
					currentParsed = updateWorkTaskState(currentParsed, nextPending, 'inProgress');
					this.timerManager.advanceExercise(workId, nextPending);
					await updateFile(currentParsed);
				} else {
					await updateFile(currentParsed);
				}
			},

			onTaskSkip: async (taskIndex: number): Promise<void> => {
				hasPendingChanges = false;
				const timerState = this.timerManager.getTimerState(workId);
				if (timerState && timerState.exerciseElapsed > 0) {
					currentParsed = setWorkTaskActualDuration(
						currentParsed,
						taskIndex,
						formatDurationHuman(timerState.exerciseElapsed)
					);
				}

				currentParsed = updateWorkTaskState(currentParsed, taskIndex, 'skipped');

				const nextPending = currentParsed.tasks.findIndex(
					(t, i) => i > taskIndex && t.state === 'pending'
				);

				if (nextPending >= 0) {
					currentParsed = updateWorkTaskState(currentParsed, nextPending, 'inProgress');
					this.timerManager.advanceExercise(workId, nextPending);
					await updateFile(currentParsed);
				} else {
					await updateFile(currentParsed);
				}
			},

			onPauseTask: (): void => {
				this.timerManager.pauseExercise(workId);
			},

			onResumeTask: (): void => {
				this.timerManager.resumeExercise(workId);
			},

			onFlushChanges: flushChanges,
		};
	}

	private createWorkoutCallbacks(
		ctx: MarkdownPostProcessorContext,
		sectionInfo: SectionInfo | null,
		parsed: ParsedWorkout,
		workoutId: string
	): WorkoutCallbacks {
		let currentParsed = parsed;
		let hasPendingChanges = false;

		const updateFile = async (newParsed: ParsedWorkout): Promise<void> => {
			currentParsed = newParsed;
			hasPendingChanges = false;
			const newContent = serializeWorkout(newParsed);
			const expectedTitle = currentParsed.metadata.title;
			await this.fileUpdater?.updateCodeBlock(ctx.sourcePath, sectionInfo, newContent, expectedTitle);
		};

		const flushChanges = async (): Promise<void> => {
			if (hasPendingChanges) {
				await updateFile(currentParsed);
			}
		};

		return {
			onStartWorkout: async (): Promise<void> => {
				hasPendingChanges = false;
				currentParsed.metadata.state = 'started';
				currentParsed.metadata.startDate = this.formatStartDate(new Date());

				const firstPending = currentParsed.exercises.findIndex(e => e.state === 'pending');
				if (firstPending >= 0) {
					const exercise = currentParsed.exercises[firstPending];
					if (exercise) {
						exercise.state = 'inProgress';
					}
				}

				await updateFile(currentParsed);
				this.timerManager.startWorkoutTimer(workoutId, firstPending >= 0 ? firstPending : 0);
			},

			onFinishWorkout: async (): Promise<void> => {
				const timerState = this.timerManager.getTimerState(workoutId);
				if (timerState) {
					currentParsed.metadata.duration = formatDurationHuman(timerState.workoutElapsed);
				}

				currentParsed.metadata.state = 'completed';
				currentParsed = lockAllFields(currentParsed);

				await updateFile(currentParsed);
				this.timerManager.stopWorkoutTimer(workoutId);
			},

			onExerciseFinish: async (exerciseIndex: number): Promise<void> => {
				hasPendingChanges = false;
				const exercise = currentParsed.exercises[exerciseIndex];
				if (!exercise) return;

				const timerState = this.timerManager.getTimerState(workoutId);
				if (timerState) {
					currentParsed = setRecordedDuration(
						currentParsed,
						exerciseIndex,
						formatDurationHuman(timerState.exerciseElapsed)
					);
				}

				currentParsed = updateExerciseState(currentParsed, exerciseIndex, 'completed');

				const nextPending = currentParsed.exercises.findIndex(
					(e, i) => i > exerciseIndex && e.state === 'pending'
				);

				if (nextPending >= 0) {
					currentParsed = updateExerciseState(currentParsed, nextPending, 'inProgress');
					this.timerManager.advanceExercise(workoutId, nextPending);
					await updateFile(currentParsed);
				} else {
					currentParsed.metadata.state = 'completed';
					const finalState = this.timerManager.getTimerState(workoutId);
					if (finalState) {
						currentParsed.metadata.duration = formatDurationHuman(finalState.workoutElapsed);
					}
					currentParsed = lockAllFields(currentParsed);
					await updateFile(currentParsed);
					this.timerManager.stopWorkoutTimer(workoutId);
				}
			},

			onExerciseAddSet: async (exerciseIndex: number): Promise<void> => {
				hasPendingChanges = false;
				const exercise = currentParsed.exercises[exerciseIndex];
				if (!exercise) return;

				const timerState = this.timerManager.getTimerState(workoutId);
				if (timerState) {
					currentParsed = setRecordedDuration(
						currentParsed,
						exerciseIndex,
						formatDurationHuman(timerState.exerciseElapsed)
					);
				}

				currentParsed = updateExerciseState(currentParsed, exerciseIndex, 'completed');
				currentParsed = addSet(currentParsed, exerciseIndex);
				currentParsed = updateExerciseState(currentParsed, exerciseIndex + 1, 'inProgress');
				this.timerManager.advanceExercise(workoutId, exerciseIndex + 1);
				await updateFile(currentParsed);
			},

			onExerciseAddRest: async (exerciseIndex: number): Promise<void> => {
				hasPendingChanges = false;
				const exercise = currentParsed.exercises[exerciseIndex];
				const restDuration = currentParsed.metadata.restDuration;
				if (!exercise || !restDuration) return;

				const timerState = this.timerManager.getTimerState(workoutId);
				if (timerState) {
					currentParsed = setRecordedDuration(
						currentParsed,
						exerciseIndex,
						formatDurationHuman(timerState.exerciseElapsed)
					);
				}

				currentParsed = updateExerciseState(currentParsed, exerciseIndex, 'completed');
				currentParsed = addRest(currentParsed, exerciseIndex, restDuration);
				currentParsed = updateExerciseState(currentParsed, exerciseIndex + 1, 'inProgress');
				this.timerManager.advanceExercise(workoutId, exerciseIndex + 1);
				await updateFile(currentParsed);
			},

			onExerciseSkip: async (exerciseIndex: number): Promise<void> => {
				hasPendingChanges = false;
				const timerState = this.timerManager.getTimerState(workoutId);
				if (timerState && timerState.exerciseElapsed > 0) {
					currentParsed = setRecordedDuration(
						currentParsed,
						exerciseIndex,
						formatDurationHuman(timerState.exerciseElapsed)
					);
				}

				currentParsed = updateExerciseState(currentParsed, exerciseIndex, 'skipped');

				const nextPending = currentParsed.exercises.findIndex(
					(e, i) => i > exerciseIndex && e.state === 'pending'
				);

				if (nextPending >= 0) {
					currentParsed = updateExerciseState(currentParsed, nextPending, 'inProgress');
					this.timerManager.advanceExercise(workoutId, nextPending);
					await updateFile(currentParsed);
				} else {
					currentParsed.metadata.state = 'completed';
					const finalState = this.timerManager.getTimerState(workoutId);
					if (finalState) {
						currentParsed.metadata.duration = formatDurationHuman(finalState.workoutElapsed);
					}
					currentParsed = lockAllFields(currentParsed);
					this.timerManager.stopWorkoutTimer(workoutId);
					await updateFile(currentParsed);
				}
			},

			onParamChange: (exerciseIndex: number, paramKey: string, newValue: string): void => {
				const exercise = currentParsed.exercises[exerciseIndex];
				const param = exercise?.params.find(p => p.key === paramKey);
				if (param?.value === newValue) {
					return;
				}
				currentParsed = updateParamValue(currentParsed, exerciseIndex, paramKey, newValue);
				hasPendingChanges = true;
			},

			onFlushChanges: flushChanges,

			onPauseExercise: (): void => {
				this.timerManager.pauseExercise(workoutId);
			},

			onResumeExercise: (): void => {
				this.timerManager.resumeExercise(workoutId);
			},

			onAddSample: async (): Promise<void> => {
				const sampleWorkout = createSampleWorkout();
				const newContent = serializeWorkout(sampleWorkout);
				await this.fileUpdater?.updateCodeBlock(
					ctx.sourcePath,
					sectionInfo,
					newContent,
					sampleWorkout.metadata.title
				);
			}
		};
	}

	private createStudyCallbacks(
		ctx: MarkdownPostProcessorContext,
		sectionInfo: SectionInfo | null,
		parsed: ParsedStudyLog,
		studyId: string
	): StudyLogCallbacks {
		let currentParsed = parsed;
		let hasPendingChanges = false;

		const updateFile = async (newParsed: ParsedStudyLog): Promise<void> => {
			currentParsed = newParsed;
			hasPendingChanges = false;
			const newContent = serializeStudyLog(newParsed);
			const expectedTitle = currentParsed.metadata.title;
			await this.fileUpdater?.updateCodeBlock(ctx.sourcePath, sectionInfo, newContent, expectedTitle);
		};

		const flushChanges = async (): Promise<void> => {
			if (hasPendingChanges) {
				await updateFile(currentParsed);
			}
		};

		return {
			onStartStudy: async (): Promise<void> => {
				hasPendingChanges = false;
				currentParsed.metadata.state = 'started';
				currentParsed.metadata.startDate = this.formatStartDate(new Date());

				const firstPending = currentParsed.tasks.findIndex(t => t.state === 'pending');
				if (firstPending >= 0) {
					currentParsed = updateStudyTaskState(currentParsed, firstPending, 'inProgress');
				}

				await updateFile(currentParsed);
				this.timerManager.startWorkoutTimer(
					studyId,
					firstPending >= 0 ? firstPending : 0,
					this.settings.enablePomodoro ? {
						enabled: true,
						workDuration: this.settings.pomodoroWork * 60,
						breakDuration: this.settings.pomodoroBreak * 60
					} : undefined
				);
			},

			onFinishStudy: async (): Promise<void> => {
				const timerState = this.timerManager.getTimerState(studyId);
				if (timerState) {
					currentParsed.metadata.totalDuration = formatDurationHuman(timerState.workoutElapsed);
				}
				currentParsed.metadata.endDate = this.formatStartDate(new Date());
				currentParsed.metadata.state = 'completed';

				await updateFile(currentParsed);
				this.timerManager.stopWorkoutTimer(studyId);
			},

			onTaskFinish: async (taskIndex: number): Promise<void> => {
				hasPendingChanges = false;
				const task = currentParsed.tasks[taskIndex];
				if (!task) return;

				const timerState = this.timerManager.getTimerState(studyId);
				if (timerState) {
					currentParsed = setStudyTaskDuration(
						currentParsed,
						taskIndex,
						formatDurationHuman(timerState.exerciseElapsed)
					);
				}

				currentParsed = updateStudyTaskState(currentParsed, taskIndex, 'completed');

				const nextPending = currentParsed.tasks.findIndex(
					(t, i) => i > taskIndex && t.state === 'pending'
				);

				if (nextPending >= 0) {
					currentParsed = updateStudyTaskState(currentParsed, nextPending, 'inProgress');
					this.timerManager.advanceExercise(studyId, nextPending);
					await updateFile(currentParsed);
				} else {
					await updateFile(currentParsed);
				}
			},

			onTaskSkip: async (taskIndex: number): Promise<void> => {
				hasPendingChanges = false;
				const timerState = this.timerManager.getTimerState(studyId);
				if (timerState && timerState.exerciseElapsed > 0) {
					currentParsed = setStudyTaskDuration(
						currentParsed,
						taskIndex,
						formatDurationHuman(timerState.exerciseElapsed)
					);
				}

				currentParsed = updateStudyTaskState(currentParsed, taskIndex, 'skipped');

				const nextPending = currentParsed.tasks.findIndex(
					(t, i) => i > taskIndex && t.state === 'pending'
				);

				if (nextPending >= 0) {
					currentParsed = updateStudyTaskState(currentParsed, nextPending, 'inProgress');
					this.timerManager.advanceExercise(studyId, nextPending);
					await updateFile(currentParsed);
				} else {
					await updateFile(currentParsed);
				}
			},

			onPauseTask: (): void => {
				this.timerManager.pauseExercise(studyId);
			},

			onResumeTask: (): void => {
				this.timerManager.resumeExercise(studyId);
			},

			onFlushChanges: flushChanges,

			onOpenSelfEval: (): void => {
				new SelfEvalModal(this.app, async (result) => {
					currentParsed = setStudyScores(currentParsed, result.focusScore, result.comprehensionScore);

					const timerState = this.timerManager.getTimerState(studyId);
					if (timerState) {
						currentParsed.metadata.totalDuration = formatDurationHuman(timerState.workoutElapsed);
					}
					currentParsed.metadata.endDate = this.formatStartDate(new Date());
					currentParsed.metadata.state = 'completed';

					for (let i = 0; i < currentParsed.tasks.length; i++) {
						const task = currentParsed.tasks[i];
						if (task && task.state === 'inProgress') {
							const ts = this.timerManager.getTimerState(studyId);
							if (ts) {
								currentParsed = setStudyTaskDuration(currentParsed, i, formatDurationHuman(ts.exerciseElapsed));
							}
							currentParsed = updateStudyTaskState(currentParsed, i, 'completed');
						}
					}

					await updateFile(currentParsed);
					this.timerManager.stopWorkoutTimer(studyId);
				}).open();
			}
		};
	}

	private formatStartDate(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		return `${year}-${month}-${day} ${hours}:${minutes}`;
	}

	private processMealBlock(
		source: string,
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext
	): void {
		const parsed = parseMealLog(source);
		const sectionInfo = ctx.getSectionInfo(el) as SectionInfo | null;
		const mealId = `meal:${ctx.sourcePath}:${sectionInfo?.lineStart ?? 0}`;

		const callbacks = this.createMealCallbacks(ctx, sectionInfo, parsed, mealId);

		renderMealLog({
			el,
			parsed,
			callbacks,
			mealId,
			app: this.app
		});
	}

	private createMealCallbacks(
		ctx: MarkdownPostProcessorContext,
		sectionInfo: SectionInfo | null,
		parsed: ParsedMealLog,
		mealId: string
	): MealLogCallbacks {
		let currentParsed = parsed;

		const updateFile = async (newParsed: ParsedMealLog): Promise<void> => {
			currentParsed = newParsed;
			const newContent = serializeMealLog(newParsed);
			const expectedTitle = currentParsed.metadata.title;
			await this.fileUpdater?.updateCodeBlock(ctx.sourcePath, sectionInfo, newContent, expectedTitle);
		};

		return {
			onCompleteMeal: async (): Promise<void> => {
				currentParsed.metadata.state = 'completed';
				if (!currentParsed.metadata.date) {
					currentParsed.metadata.date = this.formatStartDate(new Date());
				}

				// Mark all pending foods as completed
				for (let i = 0; i < currentParsed.foods.length; i++) {
					const food = currentParsed.foods[i];
					if (food && food.state === 'pending') {
						currentParsed = toggleFoodState(currentParsed, i);
					}
				}

				await updateFile(currentParsed);
			},

			onFoodToggle: async (foodIndex: number): Promise<void> => {
				currentParsed = toggleFoodState(currentParsed, foodIndex);
				await updateFile(currentParsed);
			},

			onAddFood: async (foodName: string): Promise<void> => {
				currentParsed = addFoodItem(currentParsed, foodName);
				await updateFile(currentParsed);
			},

			onRemoveFood: async (foodIndex: number): Promise<void> => {
				currentParsed = removeFoodItem(currentParsed, foodIndex);
				await updateFile(currentParsed);
			},

			onPhotoChange: async (photoPath: string): Promise<void> => {
				currentParsed = setMealPhoto(currentParsed, photoPath);
				await updateFile(currentParsed);
			},

			onFlushChanges: async (): Promise<void> => {
				// No pending changes model for meal log
			}
		};
	}
}
