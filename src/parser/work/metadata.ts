import { WorkMetadata, WorkState } from '../../types';

const VALID_STATES: WorkState[] = ['planned', 'started', 'completed'];

export function parseWorkMetadata(lines: string[]): WorkMetadata {
	const metadata: WorkMetadata = {
		title: '',
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
			case 'state':
				if (VALID_STATES.includes(value as WorkState)) {
					metadata.state = value as WorkState;
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
			case 'tags':
				if (value) {
					metadata.tags = value.split(',').map(t => t.trim()).filter(t => t);
				}
				break;
		}
	}

	return metadata;
}

export function serializeWorkMetadata(metadata: WorkMetadata): string[] {
	const lines: string[] = [];

	if (metadata.title) lines.push(`title: ${metadata.title}`);
	lines.push(`state: ${metadata.state}`);
	if (metadata.startDate) lines.push(`startDate: ${metadata.startDate}`);
	if (metadata.endDate) lines.push(`endDate: ${metadata.endDate}`);
	if (metadata.totalDuration) lines.push(`totalDuration: ${metadata.totalDuration}`);
	if (metadata.tags && metadata.tags.length > 0) {
		lines.push(`tags: ${metadata.tags.join(', ')}`);
	}

	return lines;
}
