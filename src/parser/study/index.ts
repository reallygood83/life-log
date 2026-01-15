import { ParsedStudyLog } from '../../types';
import { parseStudyMetadata } from './metadata';
import { parseStudyTask } from './task';

export function parseStudyLog(source: string): ParsedStudyLog {
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
	const metadata = parseStudyMetadata(metadataLines);

	const taskStartIndex = separatorIndex >= 0 ? separatorIndex + 1 : 0;
	const taskLines = rawLines.slice(taskStartIndex);

	const tasks = [];
	for (let i = 0; i < taskLines.length; i++) {
		const line = taskLines[i];
		if (!line) continue;

		const task = parseStudyTask(line, i);
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

export { parseStudyMetadata, serializeStudyMetadata } from './metadata';
export { parseStudyTask, serializeStudyTask, getStudyTaskStateChar } from './task';
