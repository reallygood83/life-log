import { ParsedWorkLog } from '../../types';
import { parseWorkMetadata } from './metadata';
import { parseWorkTask } from './task';

export function parseWorkLog(source: string): ParsedWorkLog {
	const rawLines = source.split('\n');

	let separatorIndex = -1;
	for (let i = 0; i < rawLines.length; i++) {
		if (rawLines[i]?.trim() === '---') {
			separatorIndex = i;
			break;
		}
	}

	const metadataLines = separatorIndex > 0
		? rawLines.slice(0, separatorIndex)
		: [];
	const metadata = parseWorkMetadata(metadataLines);

	const taskStartIndex = separatorIndex >= 0 ? separatorIndex + 1 : 0;
	const taskLines = rawLines.slice(taskStartIndex);

	const tasks = [];
	for (let i = 0; i < taskLines.length; i++) {
		const line = taskLines[i];
		if (!line) continue;

		const task = parseWorkTask(line, i);
		if (task) {
			tasks.push(task);
		}
	}

	return {
		metadata,
		tasks,
		rawLines,
		metadataEndIndex: separatorIndex >= 0 ? separatorIndex : -1
	};
}

export { parseWorkMetadata, serializeWorkMetadata } from './metadata';
export { parseWorkTask, serializeWorkTask, getWorkTaskStateChar } from './task';
