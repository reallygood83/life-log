
import { TimerState } from '../../types';
import { formatDuration } from '../../parser/exercise';

/**
 * Updates the timer element content based on the selected style.
 */
export function renderTimerByStyle(
    container: HTMLElement,
    state: TimerState,
    style: 'digital' | 'pomodoro' | 'analog',
    isTaskTimer: boolean = false
): void {
    container.empty();
    container.removeClass('timer-digital', 'timer-analog', 'timer-pomodoro');
    container.addClass(`timer-${style}`);

    switch (style) {
        case 'analog':
            renderAnalogTimer(container, state);
            break;
        case 'pomodoro':
            renderPomodoroTimer(container, state, isTaskTimer);
            break;
        case 'digital':
        default:
            renderDigitalTimer(container, state, isTaskTimer);
            break;
    }
}

function renderDigitalTimer(container: HTMLElement, state: TimerState, isTaskTimer: boolean): void {
    const elapsed = isTaskTimer ? state.exerciseElapsed : state.workoutElapsed;
    container.createSpan({ cls: 'timer-value', text: formatDuration(elapsed) });
    container.createSpan({ cls: 'timer-indicator count-up', text: ' ▲' });
}

function renderPomodoroTimer(container: HTMLElement, state: TimerState, isTaskTimer: boolean): void {
    // Pomodoro style: Focus on remaining time if in a phase, or total elapsed if not
    if (state.pomodoroEnabled && state.pomodoroPhase) {
        const phaseName = state.pomodoroPhase === 'work' ? '집중' : '휴식';
        const remaining = state.pomodoroRemaining ?? 0;
        const progress = state.pomodoroProgress ?? 0;

        const wrapper = container.createDiv({ cls: 'pomodoro-timer-wrapper' });

        // Text part
        const textEl = wrapper.createDiv({ cls: 'pomodoro-text' });
        textEl.createSpan({ cls: 'pomodoro-phase', text: phaseName });
        textEl.createSpan({ cls: 'pomodoro-time', text: formatDuration(remaining) });

        // Visual progress bar (mini)
        const progressEl = wrapper.createDiv({ cls: 'pomodoro-progress-bar' });
        progressEl.createDiv({
            cls: 'pomodoro-progress-fill',
            attr: { style: `width: ${progress}%` }
        });
    } else {
        // Fallback to digital if pomodoro not active
        renderDigitalTimer(container, state, isTaskTimer);
    }
}

function renderAnalogTimer(container: HTMLElement, state: TimerState): void {
    // Analog style: A small SVG clock
    const elapsed = state.workoutElapsed;
    const size = 40; // px
    const center = size / 2;
    const radius = size / 2 - 2;

    // Calculate hand angles
    // Second hand: 6 degrees per second
    const secondsAngle = (elapsed % 60) * 6;
    // Minute hand: 6 degrees per minute + 0.1 degree per second
    const minutesAngle = ((elapsed / 60) % 60) * 6 + (elapsed % 60) * 0.1;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', `${size}`);
    svg.setAttribute('height', `${size}`);
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.classList.add('analog-clock-svg');

    // Clock face
    const face = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    face.setAttribute('cx', `${center}`);
    face.setAttribute('cy', `${center}`);
    face.setAttribute('r', `${radius}`);
    face.setAttribute('fill', 'none');
    face.setAttribute('stroke', 'currentColor');
    face.setAttribute('stroke-width', '2');
    svg.appendChild(face);

    // Minute hand
    const minuteHand = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    minuteHand.setAttribute('x1', `${center}`);
    minuteHand.setAttribute('y1', `${center}`);
    minuteHand.setAttribute('x2', `${center}`);
    minuteHand.setAttribute('y2', `${center - radius * 0.7}`);
    minuteHand.setAttribute('stroke', 'currentColor');
    minuteHand.setAttribute('stroke-width', '2');
    minuteHand.setAttribute('transform', `rotate(${minutesAngle} ${center} ${center})`);
    svg.appendChild(minuteHand);

    // Second hand
    const secondHand = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    secondHand.setAttribute('x1', `${center}`);
    secondHand.setAttribute('y1', `${center}`);
    secondHand.setAttribute('x2', `${center}`);
    secondHand.setAttribute('y2', `${center - radius * 0.85}`);
    secondHand.setAttribute('stroke', 'var(--text-accent)');
    secondHand.setAttribute('stroke-width', '1');
    secondHand.setAttribute('transform', `rotate(${secondsAngle} ${center} ${center})`);
    svg.appendChild(secondHand);

    // Center dot
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', `${center}`);
    dot.setAttribute('cy', `${center}`);
    dot.setAttribute('r', '2');
    dot.setAttribute('fill', 'currentColor');
    svg.appendChild(dot);

    container.appendChild(svg);

    // Also show digital time below/next to it small? No, analog only for now or title tooltip
    container.setAttribute('title', `Total: ${formatDuration(elapsed)}`);
}
