import { ParsedMealLog } from '../../types';
import { parseMealMetadata } from './metadata';
import { parseFoodItem } from './food';

export function parseMealLog(source: string): ParsedMealLog {
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
	const metadata = parseMealMetadata(metadataLines);

	const foodStartIndex = separatorIndex >= 0 ? separatorIndex + 1 : 0;
	const foodLines = rawLines.slice(foodStartIndex);

	const foods = [];
	for (let i = 0; i < foodLines.length; i++) {
		const line = foodLines[i];
		if (!line) continue;

		const food = parseFoodItem(line, i);
		if (food) {
			foods.push(food);
		}
	}

	return {
		metadata,
		foods,
		rawLines,
		metadataEndIndex: separatorIndex >= 0 ? separatorIndex : -1
	};
}

export { parseMealMetadata, serializeMealMetadata } from './metadata';
export { parseFoodItem, serializeFoodItem, getFoodStateChar } from './food';
