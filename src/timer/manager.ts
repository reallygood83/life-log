import { TimerInstance, TimerState, TimerCallback, PomodoroPhase } from '../types';
import { playNotificationSound } from '../utils/audio';

export interface PomodoroConfig {
	enabled: boolean;
	workDuration: number;
	breakDuration: number;
	longBreakDuration?: number;
	cyclesBeforeLongBreak?: number;
}

export class TimerManager {
	private timers: Map<string, TimerInstance> = new Map();
	private intervalId: number | null = null;
	private onAutoAdvance: ((workoutId: string) => void) | null = null;
	private onPomodoroPhaseChange: ((workoutId: string, phase: PomodoroPhase, cycle: number) => void) | null = null;

	setAutoAdvanceCallback(callback: (workoutId: string) => void): void {
		this.onAutoAdvance = callback;
	}

	setPomodoroPhaseChangeCallback(callback: (workoutId: string, phase: PomodoroPhase, cycle: number) => void): void {
		this.onPomodoroPhaseChange = callback;
	}

	startWorkoutTimer(
		workoutId: string, 
		activeExerciseIndex: number = 0,
		pomodoroConfig?: PomodoroConfig
	): void {
		const now = Date.now();

		const existing = this.timers.get(workoutId);
		if (existing) {
			existing.exerciseStartTime = now;
			existing.exercisePausedTime = 0;
			existing.isPaused = false;
			existing.activeExerciseIndex = activeExerciseIndex;
			
			if (pomodoroConfig?.enabled) {
				existing.pomodoroEnabled = true;
				existing.pomodoroPhase = 'work';
				existing.pomodoroCycle = 1;
				existing.pomodoroWorkDuration = pomodoroConfig.workDuration;
				existing.pomodoroBreakDuration = pomodoroConfig.breakDuration;
				existing.pomodoroPhaseStartTime = now;
				existing.pomodoroPausedTime = 0;
			}
		} else {
			this.timers.set(workoutId, {
				workoutId,
				workoutStartTime: now,
				exerciseStartTime: now,
				exercisePausedTime: 0,
				isPaused: false,
				activeExerciseIndex,
				callbacks: new Set(),
				pomodoroEnabled: pomodoroConfig?.enabled ?? false,
				pomodoroPhase: 'work',
				pomodoroCycle: 1,
				pomodoroWorkDuration: pomodoroConfig?.workDuration ?? 25 * 60,
				pomodoroBreakDuration: pomodoroConfig?.breakDuration ?? 5 * 60,
				pomodoroPhaseStartTime: now,
				pomodoroPausedTime: 0,
			});
		}

		this.ensureInterval();
	}

	advanceExercise(workoutId: string, newExerciseIndex: number): void {
		const timer = this.timers.get(workoutId);
		if (!timer) return;

		timer.exerciseStartTime = Date.now();
		timer.exercisePausedTime = 0;
		timer.isPaused = false;
		timer.activeExerciseIndex = newExerciseIndex;
	}

	pauseExercise(workoutId: string): void {
		const timer = this.timers.get(workoutId);
		if (!timer || timer.isPaused) return;

		timer.isPaused = true;
		const now = Date.now();
		timer.exercisePausedTime += now - timer.exerciseStartTime;
		
		if (timer.pomodoroEnabled) {
			timer.pomodoroPausedTime += now - timer.pomodoroPhaseStartTime;
		}
	}

	resumeExercise(workoutId: string): void {
		const timer = this.timers.get(workoutId);
		if (!timer || !timer.isPaused) return;

		timer.isPaused = false;
		const now = Date.now();
		timer.exerciseStartTime = now;
		
		if (timer.pomodoroEnabled) {
			timer.pomodoroPhaseStartTime = now;
		}
	}

	stopWorkoutTimer(workoutId: string): void {
		this.timers.delete(workoutId);

		if (this.timers.size === 0 && this.intervalId !== null) {
			window.clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}

	subscribe(workoutId: string, callback: TimerCallback): () => void {
		const timer = this.timers.get(workoutId);
		if (!timer) {
			return () => {};
		}

		timer.callbacks.add(callback);

		const state = this.getTimerState(workoutId);
		if (state) {
			callback(state);
		}

		return () => {
			timer.callbacks.delete(callback);
		};
	}

	getTimerState(workoutId: string): TimerState | null {
		const timer = this.timers.get(workoutId);
		if (!timer) return null;

		const now = Date.now();

		const workoutElapsed = Math.floor((now - timer.workoutStartTime) / 1000);

		let exerciseElapsed: number;
		if (timer.isPaused) {
			exerciseElapsed = Math.floor(timer.exercisePausedTime / 1000);
		} else {
			const currentExerciseTime = now - timer.exerciseStartTime;
			exerciseElapsed = Math.floor((timer.exercisePausedTime + currentExerciseTime) / 1000);
		}

		const state: TimerState = {
			workoutElapsed,
			exerciseElapsed,
			isOvertime: false
		};

		if (timer.pomodoroEnabled) {
			const phaseDuration = timer.pomodoroPhase === 'work' 
				? timer.pomodoroWorkDuration 
				: timer.pomodoroBreakDuration;
			
			let pomodoroElapsed: number;
			if (timer.isPaused) {
				pomodoroElapsed = Math.floor(timer.pomodoroPausedTime / 1000);
			} else {
				const currentPhaseTime = now - timer.pomodoroPhaseStartTime;
				pomodoroElapsed = Math.floor((timer.pomodoroPausedTime + currentPhaseTime) / 1000);
			}
			
			const pomodoroRemaining = Math.max(0, phaseDuration - pomodoroElapsed);
			const pomodoroProgress = Math.min(100, (pomodoroElapsed / phaseDuration) * 100);

			state.pomodoroEnabled = true;
			state.pomodoroPhase = timer.pomodoroPhase;
			state.pomodoroCycle = timer.pomodoroCycle;
			state.pomodoroElapsed = pomodoroElapsed;
			state.pomodoroRemaining = pomodoroRemaining;
			state.pomodoroProgress = pomodoroProgress;
		}

		return state;
	}

	getActiveExerciseIndex(workoutId: string): number {
		const timer = this.timers.get(workoutId);
		return timer?.activeExerciseIndex ?? 0;
	}

	setActiveExerciseIndex(workoutId: string, index: number): void {
		const timer = this.timers.get(workoutId);
		if (!timer) return;

		if (timer.activeExerciseIndex !== index) {
			timer.activeExerciseIndex = index;
			timer.exerciseStartTime = Date.now();
			timer.exercisePausedTime = 0;
			timer.isPaused = false;
		}
	}

	isTimerRunning(workoutId: string): boolean {
		return this.timers.has(workoutId);
	}

	isPaused(workoutId: string): boolean {
		const timer = this.timers.get(workoutId);
		return timer?.isPaused ?? false;
	}

	getPomodoroPhase(workoutId: string): PomodoroPhase | null {
		const timer = this.timers.get(workoutId);
		if (!timer || !timer.pomodoroEnabled) return null;
		return timer.pomodoroPhase;
	}

	private ensureInterval(): void {
		if (this.intervalId !== null) return;

		this.intervalId = window.setInterval(() => {
			this.tick();
		}, 1000);
	}

	private tick(): void {
		for (const [workoutId, timer] of this.timers) {
			const state = this.getTimerState(workoutId);
			if (!state) continue;

			if (timer.pomodoroEnabled && !timer.isPaused) {
				this.checkPomodoroPhaseComplete(workoutId, timer, state);
			}

			for (const callback of timer.callbacks) {
				callback(state);
			}
		}
	}

	private checkPomodoroPhaseComplete(workoutId: string, timer: TimerInstance, state: TimerState): void {
		if (!state.pomodoroRemaining || state.pomodoroRemaining > 0) return;

		const now = Date.now();
		const previousPhase = timer.pomodoroPhase;

		if (timer.pomodoroPhase === 'work') {
			timer.pomodoroPhase = 'break';
			playNotificationSound('break');
		} else {
			timer.pomodoroPhase = 'work';
			timer.pomodoroCycle++;
			playNotificationSound('complete');
		}

		timer.pomodoroPhaseStartTime = now;
		timer.pomodoroPausedTime = 0;

		if (this.onPomodoroPhaseChange) {
			this.onPomodoroPhaseChange(workoutId, timer.pomodoroPhase, timer.pomodoroCycle);
		}
	}

	checkAutoAdvance(workoutId: string, targetDuration: number | undefined): void {
		if (targetDuration === undefined) return;

		const state = this.getTimerState(workoutId);
		if (!state) return;

		if (state.exerciseElapsed >= targetDuration && this.onAutoAdvance) {
			this.onAutoAdvance(workoutId);
		}
	}

	destroy(): void {
		if (this.intervalId !== null) {
			window.clearInterval(this.intervalId);
			this.intervalId = null;
		}
		this.timers.clear();
	}
}
