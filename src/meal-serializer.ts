import { ParsedMealLog, FoodItem, FoodItemState } from './types';
import { serializeMealMetadata } from './parser/meal/metadata';
import { serializeFoodItem } from './parser/meal/food';

export function serializeMealLog(parsed: ParsedMealLog): string {
	const lines: string[] = [];

	const metadataLines = serializeMealMetadata(parsed.metadata);
	lines.push(...metadataLines);

	lines.push('---');

	for (const food of parsed.foods) {
		lines.push(serializeFoodItem(food));
	}

	return lines.join('\n');
}

export function updateFoodState(
	parsed: ParsedMealLog,
	foodIndex: number,
	newState: FoodItemState
): ParsedMealLog {
	const newParsed = structuredClone(parsed);
	const food = newParsed.foods[foodIndex];
	if (!food) return parsed;

	food.state = newState;
	return newParsed;
}

export function addFoodItem(
	parsed: ParsedMealLog,
	foodName: string
): ParsedMealLog {
	const newParsed = structuredClone(parsed);

	const newFood: FoodItem = {
		state: 'pending',
		name: foodName,
		lineIndex: newParsed.foods.length
	};

	newParsed.foods.push(newFood);
	return newParsed;
}

export function removeFoodItem(
	parsed: ParsedMealLog,
	foodIndex: number
): ParsedMealLog {
	const newParsed = structuredClone(parsed);

	if (foodIndex < 0 || foodIndex >= newParsed.foods.length) {
		return parsed;
	}

	newParsed.foods.splice(foodIndex, 1);

	// Update line indices
	for (let i = foodIndex; i < newParsed.foods.length; i++) {
		const food = newParsed.foods[i];
		if (food) {
			food.lineIndex = i;
		}
	}

	return newParsed;
}

export function setMealPhoto(
	parsed: ParsedMealLog,
	photoPath: string
): ParsedMealLog {
	const newParsed = structuredClone(parsed);
	newParsed.metadata.photo = photoPath;
	return newParsed;
}

export function toggleFoodState(
	parsed: ParsedMealLog,
	foodIndex: number
): ParsedMealLog {
	const newParsed = structuredClone(parsed);
	const food = newParsed.foods[foodIndex];
	if (!food) return parsed;

	food.state = food.state === 'completed' ? 'pending' : 'completed';
	return newParsed;
}
