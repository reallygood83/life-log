import { ParsedWorkLog, WorkTask, WorkTaskState } from './types';
import { serializeWorkMetadata } from './parser/work/metadata';
import { serializeWorkTask } from './parser/work/task';

export function serializeWorkLog(parsed: ParsedWorkLog): string {
	const lines: string[] = [];

	const metadataLines = serializeWorkMetadata(parsed.metadata);
	lines.push(...metadataLines);

	lines.push('---');

	for (const task of parsed.tasks) {
		lines.push(serializeWorkTask(task));
	}

	return lines.join('\n');
}

export function updateWorkTaskState(
	parsed: ParsedWorkLog,
	taskIndex: number,
	newState: WorkTaskState
): ParsedWorkLog {
	const newParsed = structuredClone(parsed);
	const task = newParsed.tasks[taskIndex];
	if (!task) return parsed;

	task.state = newState;
	return newParsed;
}

export function setWorkTaskActualDuration(
	parsed: ParsedWorkLog,
	taskIndex: number,
	durationStr: string
): ParsedWorkLog {
	const newParsed = structuredClone(parsed);
	const task = newParsed.tasks[taskIndex];
	if (!task) return parsed;

	task.actualDuration = durationStr;
	return newParsed;
}

export function createSampleWorkLog(): ParsedWorkLog {
	const now = new Date();
	const dateStr = formatDateTimeForLog(now);
	
	const metadata = {
		title: `${getTimePeriod(now)} 업무`,
		state: 'planned' as const,
	};

	const tasks: WorkTask[] = [
		{
			state: 'pending',
			name: '업무 항목 1',
			priority: 'high',
			expectedDuration: 2 * 60 * 60,
			lineIndex: 0
		},
		{
			state: 'pending',
			name: '업무 항목 2',
			priority: 'medium',
			expectedDuration: 1 * 60 * 60,
			lineIndex: 1
		},
		{
			state: 'pending',
			name: '업무 항목 3',
			priority: 'low',
			expectedDuration: 30 * 60,
			lineIndex: 2
		},
	];

	return {
		metadata,
		tasks,
		rawLines: [],
		metadataEndIndex: -1
	};
}

function getTimePeriod(date: Date): string {
	const hours = date.getHours();
	if (hours < 12) return '오전';
	if (hours < 18) return '오후';
	return '저녁';
}

function formatDateTimeForLog(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	return `${year}-${month}-${day} ${hours}:${minutes}`;
}
