import { WorkTask, WorkTaskState, WorkPriority } from '../../types';
import { parseDurationToSeconds } from '../exercise';

const TASK_PATTERN = /^-\s*\[(.)\]\s*(.+)$/;

const STATE_MAP: Record<string, WorkTaskState> = {
	' ': 'pending',
	'\\': 'inProgress',
	'x': 'completed',
	'-': 'skipped'
};

const STATE_CHAR_MAP: Record<WorkTaskState, string> = {
	'pending': ' ',
	'inProgress': '\\',
	'completed': 'x',
	'skipped': '-'
};

export function parseWorkTask(line: string, lineIndex: number): WorkTask | null {
	const match = line.match(TASK_PATTERN);
	if (!match) return null;

	const stateChar = match[1] ?? ' ';
	const rest = match[2] ?? '';

	const state = STATE_MAP[stateChar] ?? 'pending';

	const parts = rest.split('|').map(p => p.trim());
	const name = parts[0] ?? '';

	let priority: WorkPriority = 'medium';
	let expectedDuration: number | undefined;
	let actualDuration: string | undefined;
	let notes: string | undefined;

	for (let i = 1; i < parts.length; i++) {
		const part = parts[i];
		if (!part) continue;

		const colonIndex = part.indexOf(':');
		if (colonIndex === -1) {
			notes = notes ? notes + ' | ' + part : part;
			continue;
		}

		const key = part.substring(0, colonIndex).trim().toLowerCase();
		const value = part.substring(colonIndex + 1).trim();

		if (key === 'priority') {
			if (['high', 'medium', 'low'].includes(value.toLowerCase())) {
				priority = value.toLowerCase() as WorkPriority;
			}
		} else if (key === 'expected') {
			const bracketMatch = value.match(/^\[([^\]]*)\]$/);
			if (bracketMatch) {
				expectedDuration = parseDurationToSeconds(bracketMatch[1] ?? '0');
			} else {
				expectedDuration = parseDurationToSeconds(value);
			}
		} else if (key === 'actual') {
			if (value && value !== '') {
				actualDuration = value;
			}
		} else {
			notes = notes ? notes + ' | ' + part : part;
		}
	}

	return {
		state,
		name,
		priority,
		expectedDuration,
		actualDuration,
		notes,
		lineIndex
	};
}

export function getWorkTaskStateChar(state: WorkTaskState): string {
	return STATE_CHAR_MAP[state];
}

export function serializeWorkTask(task: WorkTask): string {
	const stateChar = getWorkTaskStateChar(task.state);
	let line = `- [${stateChar}] ${task.name}`;

	line += ` | Priority: ${task.priority}`;

	if (task.expectedDuration !== undefined) {
		line += ` | Expected: [${formatDurationForSerialization(task.expectedDuration)}]`;
	}

	if (task.actualDuration) {
		line += ` | Actual: ${task.actualDuration}`;
	}

	if (task.notes) {
		line += ` | ${task.notes}`;
	}

	return line;
}

function formatDurationForSerialization(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const mins = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;
	
	if (hours > 0) {
		if (mins === 0 && secs === 0) return `${hours}h`;
		if (secs === 0) return `${hours}h ${mins}m`;
		return `${hours}h ${mins}m ${secs}s`;
	}
	if (mins === 0) return `${secs}s`;
	if (secs === 0) return `${mins}m`;
	return `${mins}m ${secs}s`;
}
