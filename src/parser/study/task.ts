import { StudyTask, StudyTaskState } from '../../types';
import { parseDurationToSeconds } from '../exercise';

const TASK_PATTERN = /^-\s*\[(.)\]\s*(.+)$/;

const STATE_MAP: Record<string, StudyTaskState> = {
	' ': 'pending',
	'\\': 'inProgress',
	'x': 'completed',
	'-': 'skipped'
};

const STATE_CHAR_MAP: Record<StudyTaskState, string> = {
	'pending': ' ',
	'inProgress': '\\',
	'completed': 'x',
	'skipped': '-'
};

export function parseStudyTask(line: string, lineIndex: number): StudyTask | null {
	const match = line.match(TASK_PATTERN);
	if (!match) return null;

	const stateChar = match[1] ?? ' ';
	const rest = match[2] ?? '';

	const state = STATE_MAP[stateChar] ?? 'pending';

	const parts = rest.split('|').map(p => p.trim());
	const name = parts[0] ?? '';

	let targetDuration: number | undefined;
	let recordedDuration: string | undefined;
	let notes: string | undefined;

	for (let i = 1; i < parts.length; i++) {
		const part = parts[i];
		if (!part) continue;

		const colonIndex = part.indexOf(':');
		if (colonIndex === -1) {
			notes = part;
			continue;
		}

		const key = part.substring(0, colonIndex).trim().toLowerCase();
		const value = part.substring(colonIndex + 1).trim();

		if (key === 'duration') {
			const bracketMatch = value.match(/^\[([^\]]*)\]$/);
			if (bracketMatch) {
				targetDuration = parseDurationToSeconds(bracketMatch[1] ?? '0');
			} else {
				recordedDuration = value;
			}
		} else {
			if (!notes) notes = part;
			else notes += ' | ' + part;
		}
	}

	return {
		state,
		name,
		targetDuration,
		recordedDuration,
		notes,
		lineIndex
	};
}

export function getStudyTaskStateChar(state: StudyTaskState): string {
	return STATE_CHAR_MAP[state];
}

export function serializeStudyTask(task: StudyTask): string {
	const stateChar = getStudyTaskStateChar(task.state);
	let line = `- [${stateChar}] ${task.name}`;

	if (task.targetDuration !== undefined && task.state === 'pending') {
		line += ` | Duration: [${formatDurationForSerialization(task.targetDuration)}]`;
	} else if (task.recordedDuration) {
		line += ` | Duration: ${task.recordedDuration}`;
	}

	if (task.notes) {
		line += ` | ${task.notes}`;
	}

	return line;
}

function formatDurationForSerialization(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	if (mins === 0) return `${secs}s`;
	if (secs === 0) return `${mins}m`;
	return `${mins}m ${secs}s`;
}
