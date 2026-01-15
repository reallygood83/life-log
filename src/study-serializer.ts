import { ParsedStudyLog, StudyTask, StudyTaskState } from './types';
import { serializeStudyMetadata } from './parser/study/metadata';
import { serializeStudyTask } from './parser/study/task';

export function serializeStudyLog(parsed: ParsedStudyLog): string {
	const lines: string[] = [];

	const metadataLines = serializeStudyMetadata(parsed.metadata);
	lines.push(...metadataLines);

	lines.push('---');

	for (const task of parsed.tasks) {
		lines.push(serializeStudyTask(task));
	}

	return lines.join('\n');
}

export function updateStudyTaskState(
	parsed: ParsedStudyLog,
	taskIndex: number,
	newState: StudyTaskState
): ParsedStudyLog {
	const newParsed = structuredClone(parsed);
	const task = newParsed.tasks[taskIndex];
	if (!task) return parsed;

	task.state = newState;
	return newParsed;
}

export function setStudyTaskDuration(
	parsed: ParsedStudyLog,
	taskIndex: number,
	durationStr: string
): ParsedStudyLog {
	const newParsed = structuredClone(parsed);
	const task = newParsed.tasks[taskIndex];
	if (!task) return parsed;

	task.recordedDuration = durationStr;
	task.targetDuration = undefined;
	return newParsed;
}

export function setStudyScores(
	parsed: ParsedStudyLog,
	focusScore: number,
	comprehensionScore: number
): ParsedStudyLog {
	const newParsed = structuredClone(parsed);
	newParsed.metadata.focusScore = focusScore;
	newParsed.metadata.comprehensionScore = comprehensionScore;
	return newParsed;
}

export function createSampleStudyLog(subject: string, subjectIcon: string): ParsedStudyLog {
	const now = new Date();
	const dateStr = formatDateTimeForLog(now);
	
	const metadata = {
		title: `${getTimePeriod(now)} 학습`,
		subject: subject,
		state: 'planned' as const,
	};

	const tasks: StudyTask[] = [
		{
			state: 'pending',
			name: '학습 항목 1',
			targetDuration: 30 * 60,
			lineIndex: 0
		},
		{
			state: 'pending',
			name: '학습 항목 2',
			targetDuration: 30 * 60,
			lineIndex: 1
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
