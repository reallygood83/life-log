import { StudyMetadata, StudyState } from '../../types';

const VALID_STATES: StudyState[] = ['planned', 'started', 'completed'];

export function parseStudyMetadata(lines: string[]): StudyMetadata {
	const metadata: StudyMetadata = {
		title: '',
		subject: '',
		state: 'planned'
	};

	for (const line of lines) {
		const colonIndex = line.indexOf(':');
		if (colonIndex === -1) continue;

		const key = line.substring(0, colonIndex).trim().toLowerCase();
		const value = line.substring(colonIndex + 1).trim();

		switch (key) {
			case 'title':
				metadata.title = value;
				break;
			case 'subject':
				metadata.subject = value;
				break;
			case 'state':
				if (VALID_STATES.includes(value as StudyState)) {
					metadata.state = value as StudyState;
				}
				break;
			case 'startdate':
				if (value) metadata.startDate = value;
				break;
			case 'enddate':
				if (value) metadata.endDate = value;
				break;
			case 'totalduration':
				if (value) metadata.totalDuration = value;
				break;
			case 'focusscore':
				const focus = parseInt(value);
				if (focus >= 1 && focus <= 5) metadata.focusScore = focus;
				break;
			case 'comprehensionscore':
				const comp = parseInt(value);
				if (comp >= 1 && comp <= 5) metadata.comprehensionScore = comp;
				break;
			case 'tags':
				if (value) {
					metadata.tags = value.split(',').map(t => t.trim()).filter(t => t);
				}
				break;
		}
	}

	return metadata;
}

export function serializeStudyMetadata(metadata: StudyMetadata): string[] {
	const lines: string[] = [];

	if (metadata.title) lines.push(`title: ${metadata.title}`);
	if (metadata.subject) lines.push(`subject: ${metadata.subject}`);
	lines.push(`state: ${metadata.state}`);
	if (metadata.startDate) lines.push(`startDate: ${metadata.startDate}`);
	if (metadata.endDate) lines.push(`endDate: ${metadata.endDate}`);
	if (metadata.totalDuration) lines.push(`totalDuration: ${metadata.totalDuration}`);
	if (metadata.focusScore) lines.push(`focusScore: ${metadata.focusScore}`);
	if (metadata.comprehensionScore) lines.push(`comprehensionScore: ${metadata.comprehensionScore}`);
	if (metadata.tags && metadata.tags.length > 0) {
		lines.push(`tags: ${metadata.tags.join(', ')}`);
	}

	return lines;
}
