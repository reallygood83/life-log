import { App } from 'obsidian';
import { ParsedMealLog, MealLogCallbacks } from '../../types';
import { renderMealHeader, MealHeaderElements } from './header';
import { renderFoodItem, FoodItemElements } from './food';
import { renderMealControls } from './controls';

export interface MealRendererContext {
	el: HTMLElement;
	parsed: ParsedMealLog;
	callbacks: MealLogCallbacks;
	mealId: string;
	app: App;
}

export function renderMealLog(ctx: MealRendererContext): void {
	const { el, parsed, callbacks, app } = ctx;

	el.empty();

	const container = el.createDiv({
		cls: `meal-container state-${parsed.metadata.state}`
	});

	// Render header with title, meal type, date, and photo
	const headerElements = renderMealHeader(container, parsed.metadata);

	// Handle photo embed if present
	if (headerElements.photoEl && parsed.metadata.photo) {
		processPhotoEmbed(headerElements.photoEl, parsed.metadata.photo, app);
	}

	// Render food items
	const foodsContainer = container.createDiv({ cls: 'meal-foods' });
	const foodElements: FoodItemElements[] = [];

	if (parsed.foods.length === 0 && parsed.metadata.state !== 'completed') {
		renderEmptyMealState(foodsContainer);
	} else {
		for (let i = 0; i < parsed.foods.length; i++) {
			const food = parsed.foods[i];
			if (!food) continue;

			const elements = renderFoodItem(
				foodsContainer,
				food,
				i,
				callbacks,
				parsed.metadata.state
			);
			foodElements.push(elements);
		}
	}

	// Render controls
	renderMealControls(container, parsed.metadata.state, callbacks, parsed);

	// Handle focus out for saving changes
	container.addEventListener('focusout', (e) => {
		const relatedTarget = e.relatedTarget as HTMLElement | null;
		if (!relatedTarget || !container.contains(relatedTarget)) {
			callbacks.onFlushChanges();
		}
	});
}

function renderEmptyMealState(container: HTMLElement): void {
	const emptyEl = container.createDiv({ cls: 'meal-empty-state' });
	emptyEl.createDiv({
		cls: 'meal-empty-message',
		text: '아직 음식이 없습니다. 아래에서 음식을 추가해주세요.'
	});
}

function processPhotoEmbed(photoEl: HTMLElement, photoPath: string, app: App): void {
	// Extract file path from ![[filename]] format
	const match = photoPath.match(/!\[\[([^\]]+)\]\]/);
	if (!match) return;

	const fileName = match[1];
	if (!fileName) return;

	// Find the file in the vault
	const file = app.metadataCache.getFirstLinkpathDest(fileName, '');
	if (!file) {
		photoEl.querySelector('.meal-photo-embed')?.setText(`📷 ${fileName} (이미지를 찾을 수 없음)`);
		return;
	}

	// Get resource path for the image
	const resourcePath = app.vault.getResourcePath(file);

	// Replace embed with actual image
	const photoInner = photoEl.querySelector('.meal-photo');
	if (photoInner) {
		photoInner.empty();
		const img = photoInner.createEl('img', {
			cls: 'meal-photo-image',
			attr: {
				src: resourcePath,
				alt: fileName
			}
		});
	}
}

export { renderMealHeader, getMealTypeInfo } from './header';
export { renderFoodItem } from './food';
export { renderMealControls } from './controls';
