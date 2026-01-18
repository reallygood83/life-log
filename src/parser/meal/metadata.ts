import { MealMetadata, MealState, MealType } from '../../types';

const VALID_STATES: MealState[] = ['planned', 'started', 'completed'];
const VALID_MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export function parseMealMetadata(lines: string[]): MealMetadata {
	const metadata: MealMetadata = {
		title: '',
		mealType: 'lunch',
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
			case 'mealtype':
				if (VALID_MEAL_TYPES.includes(value.toLowerCase() as MealType)) {
					metadata.mealType = value.toLowerCase() as MealType;
				}
				break;
			case 'state':
				if (VALID_STATES.includes(value as MealState)) {
					metadata.state = value as MealState;
				}
				break;
			case 'date':
				if (value) metadata.date = value;
				break;
			case 'photo':
				if (value) metadata.photo = value;
				break;
			case 'notes':
				if (value) metadata.notes = value;
				break;
		}
	}

	return metadata;
}

export function serializeMealMetadata(metadata: MealMetadata): string[] {
	const lines: string[] = [];

	if (metadata.title) lines.push(`title: ${metadata.title}`);
	lines.push(`mealType: ${metadata.mealType}`);
	lines.push(`state: ${metadata.state}`);
	if (metadata.date) lines.push(`date: ${metadata.date}`);
	if (metadata.photo) lines.push(`photo: ${metadata.photo}`);
	if (metadata.notes) lines.push(`notes: ${metadata.notes}`);

	return lines;
}
