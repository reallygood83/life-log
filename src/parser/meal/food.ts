import { FoodItem, FoodItemState } from '../../types';

const FOOD_PATTERN = /^-\s*\[(.)\]\s*(.+)$/;

const STATE_MAP: Record<string, FoodItemState> = {
	' ': 'pending',
	'x': 'completed'
};

const STATE_CHAR_MAP: Record<FoodItemState, string> = {
	'pending': ' ',
	'completed': 'x'
};

export function parseFoodItem(line: string, lineIndex: number): FoodItem | null {
	const match = line.match(FOOD_PATTERN);
	if (!match) return null;

	const stateChar = match[1] ?? ' ';
	const name = (match[2] ?? '').trim();

	// Map state character to FoodItemState (only pending or completed)
	const state: FoodItemState = stateChar === 'x' ? 'completed' : 'pending';

	return {
		state,
		name,
		lineIndex
	};
}

export function getFoodStateChar(state: FoodItemState): string {
	return STATE_CHAR_MAP[state];
}

export function serializeFoodItem(food: FoodItem): string {
	const stateChar = getFoodStateChar(food.state);
	return `- [${stateChar}] ${food.name}`;
}
