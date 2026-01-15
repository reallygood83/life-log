import { TimerState, TimerStyle } from '../types';

export interface TimerDisplayOptions {
	style: TimerStyle;
	showTotalTime?: boolean;
	size?: 'small' | 'medium' | 'large';
}

export function renderTimerDisplay(
	container: HTMLElement,
	state: TimerState | null,
	options: TimerDisplayOptions
): HTMLElement {
	const timerEl = container.createDiv({ cls: `timer-display timer-${options.style} timer-size-${options.size || 'medium'}` });
	
	if (!state) {
		timerEl.textContent = '--:--';
		return timerEl;
	}

	switch (options.style) {
		case 'pomodoro':
			renderPomodoroTimer(timerEl, state);
			break;
		case 'analog':
			renderAnalogTimer(timerEl, state);
			break;
		case 'digital':
		default:
			renderDigitalTimer(timerEl, state, options.showTotalTime);
			break;
	}

	return timerEl;
}

export function updateTimerDisplay(
	timerEl: HTMLElement,
	state: TimerState,
	options: TimerDisplayOptions
): void {
	timerEl.empty();
	
	switch (options.style) {
		case 'pomodoro':
			renderPomodoroTimer(timerEl, state);
			break;
		case 'analog':
			renderAnalogTimer(timerEl, state);
			break;
		case 'digital':
		default:
			renderDigitalTimer(timerEl, state, options.showTotalTime);
			break;
	}
}

function renderDigitalTimer(container: HTMLElement, state: TimerState, showTotal?: boolean): void {
	const timeValue = showTotal ? state.workoutElapsed : state.exerciseElapsed;
	const timeStr = formatTime(timeValue);
	
	container.createSpan({ cls: 'timer-value', text: timeStr });
	
	if (state.pomodoroEnabled && state.pomodoroPhase) {
		const phaseEl = container.createSpan({ cls: `timer-phase phase-${state.pomodoroPhase}` });
		phaseEl.textContent = state.pomodoroPhase === 'work' ? '집중' : '휴식';
		
		if (state.pomodoroCycle) {
			container.createSpan({ cls: 'timer-cycle', text: `#${state.pomodoroCycle}` });
		}
	}
}

function renderPomodoroTimer(container: HTMLElement, state: TimerState): void {
	const circleContainer = container.createDiv({ cls: 'pomodoro-circle-container' });
	
	const size = 60;
	const strokeWidth = 4;
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	
	const progress = state.pomodoroProgress ?? 0;
	const offset = circumference - (progress / 100) * circumference;
	
	const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.setAttribute('width', size.toString());
	svg.setAttribute('height', size.toString());
	svg.setAttribute('class', 'pomodoro-svg');
	
	const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
	bgCircle.setAttribute('cx', (size / 2).toString());
	bgCircle.setAttribute('cy', (size / 2).toString());
	bgCircle.setAttribute('r', radius.toString());
	bgCircle.setAttribute('class', 'pomodoro-bg');
	svg.appendChild(bgCircle);
	
	const progressCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
	progressCircle.setAttribute('cx', (size / 2).toString());
	progressCircle.setAttribute('cy', (size / 2).toString());
	progressCircle.setAttribute('r', radius.toString());
	progressCircle.setAttribute('class', `pomodoro-progress phase-${state.pomodoroPhase || 'work'}`);
	progressCircle.setAttribute('stroke-dasharray', circumference.toString());
	progressCircle.setAttribute('stroke-dashoffset', offset.toString());
	progressCircle.setAttribute('transform', `rotate(-90 ${size / 2} ${size / 2})`);
	svg.appendChild(progressCircle);
	
	circleContainer.appendChild(svg);
	
	const timeContainer = circleContainer.createDiv({ cls: 'pomodoro-time' });
	const remaining = state.pomodoroRemaining ?? 0;
	timeContainer.createSpan({ cls: 'timer-value', text: formatTime(remaining) });
	
	const infoContainer = container.createDiv({ cls: 'pomodoro-info' });
	
	const phaseEl = infoContainer.createSpan({ cls: `timer-phase phase-${state.pomodoroPhase || 'work'}` });
	phaseEl.textContent = state.pomodoroPhase === 'work' ? '집중 시간' : '휴식 시간';
	
	if (state.pomodoroCycle) {
		infoContainer.createSpan({ cls: 'timer-cycle', text: `사이클 ${state.pomodoroCycle}` });
	}
}

function renderAnalogTimer(container: HTMLElement, state: TimerState): void {
	const clockContainer = container.createDiv({ cls: 'analog-clock-container' });
	
	const size = 60;
	const center = size / 2;
	
	const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.setAttribute('width', size.toString());
	svg.setAttribute('height', size.toString());
	svg.setAttribute('class', 'analog-svg');
	
	const face = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
	face.setAttribute('cx', center.toString());
	face.setAttribute('cy', center.toString());
	face.setAttribute('r', (center - 2).toString());
	face.setAttribute('class', 'clock-face');
	svg.appendChild(face);
	
	for (let i = 0; i < 12; i++) {
		const angle = (i * 30 - 90) * (Math.PI / 180);
		const innerRadius = center - 6;
		const outerRadius = center - 3;
		
		const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
		line.setAttribute('x1', (center + innerRadius * Math.cos(angle)).toString());
		line.setAttribute('y1', (center + innerRadius * Math.sin(angle)).toString());
		line.setAttribute('x2', (center + outerRadius * Math.cos(angle)).toString());
		line.setAttribute('y2', (center + outerRadius * Math.sin(angle)).toString());
		line.setAttribute('class', 'clock-tick');
		svg.appendChild(line);
	}
	
	const elapsed = state.pomodoroEnabled ? (state.pomodoroElapsed ?? state.exerciseElapsed) : state.exerciseElapsed;
	const totalSeconds = state.pomodoroEnabled 
		? (state.pomodoroPhase === 'work' ? 25 * 60 : 5 * 60)
		: 60 * 60;
	
	const minuteAngle = ((elapsed / totalSeconds) * 360 - 90) * (Math.PI / 180);
	const secondAngle = ((elapsed % 60) / 60 * 360 - 90) * (Math.PI / 180);
	
	const minuteHand = document.createElementNS('http://www.w3.org/2000/svg', 'line');
	minuteHand.setAttribute('x1', center.toString());
	minuteHand.setAttribute('y1', center.toString());
	minuteHand.setAttribute('x2', (center + (center - 12) * Math.cos(minuteAngle)).toString());
	minuteHand.setAttribute('y2', (center + (center - 12) * Math.sin(minuteAngle)).toString());
	minuteHand.setAttribute('class', 'clock-minute-hand');
	svg.appendChild(minuteHand);
	
	const secondHand = document.createElementNS('http://www.w3.org/2000/svg', 'line');
	secondHand.setAttribute('x1', center.toString());
	secondHand.setAttribute('y1', center.toString());
	secondHand.setAttribute('x2', (center + (center - 8) * Math.cos(secondAngle)).toString());
	secondHand.setAttribute('y2', (center + (center - 8) * Math.sin(secondAngle)).toString());
	secondHand.setAttribute('class', 'clock-second-hand');
	svg.appendChild(secondHand);
	
	const centerDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
	centerDot.setAttribute('cx', center.toString());
	centerDot.setAttribute('cy', center.toString());
	centerDot.setAttribute('r', '2');
	centerDot.setAttribute('class', 'clock-center');
	svg.appendChild(centerDot);
	
	clockContainer.appendChild(svg);
	
	const timeText = container.createDiv({ cls: 'analog-time-text' });
	timeText.createSpan({ cls: 'timer-value', text: formatTime(elapsed) });
	
	if (state.pomodoroEnabled && state.pomodoroPhase) {
		const phaseEl = timeText.createSpan({ cls: `timer-phase phase-${state.pomodoroPhase}` });
		phaseEl.textContent = state.pomodoroPhase === 'work' ? '집중' : '휴식';
	}
}

function formatTime(seconds: number): string {
	const hrs = Math.floor(seconds / 3600);
	const mins = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;
	
	if (hrs > 0) {
		return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
	}
	return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
