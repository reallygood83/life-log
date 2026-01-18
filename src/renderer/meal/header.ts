import { MealMetadata, MealType } from '../../types';

export interface MealHeaderElements {
	titleEl: HTMLElement;
	photoEl: HTMLElement | null;
}

const MEAL_TYPE_INFO: Record<MealType, { icon: string; label: string }> = {
	breakfast: { icon: '🌅', label: '아침' },
	lunch: { icon: '☀️', label: '점심' },
	dinner: { icon: '🌙', label: '저녁' },
	snack: { icon: '🍪', label: '간식' }
};

export function renderMealHeader(
	container: HTMLElement,
	metadata: MealMetadata
): MealHeaderElements {
	const headerEl = container.createDiv({ cls: 'meal-header' });

	const topRow = headerEl.createDiv({ cls: 'meal-header-top' });

	const titleEl = topRow.createDiv({ cls: 'meal-title' });
	const mealTypeInfo = MEAL_TYPE_INFO[metadata.mealType];
	titleEl.createSpan({ cls: 'meal-icon', text: mealTypeInfo.icon });
	titleEl.createSpan({
		cls: 'meal-title-text',
		text: metadata.title || mealTypeInfo.label
	});

	if (metadata.date) {
		const dateEl = topRow.createDiv({ cls: 'meal-date' });
		dateEl.createSpan({ text: metadata.date });
	}

	let photoEl: HTMLElement | null = null;
	if (metadata.photo) {
		photoEl = headerEl.createDiv({ cls: 'meal-photo-container' });
		// Render photo using Obsidian's embed format
		const photoInner = photoEl.createDiv({ cls: 'meal-photo' });
		photoInner.innerHTML = `<span class="meal-photo-embed">${metadata.photo}</span>`;
	}

	if (metadata.notes) {
		const notesEl = headerEl.createDiv({ cls: 'meal-notes' });
		notesEl.createSpan({ cls: 'meal-notes-icon', text: '📝' });
		notesEl.createSpan({ cls: 'meal-notes-text', text: metadata.notes });
	}

	return { titleEl, photoEl };
}

export function getMealTypeInfo(mealType: MealType): { icon: string; label: string } {
	return MEAL_TYPE_INFO[mealType];
}
