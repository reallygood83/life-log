import { FoodItem, MealLogCallbacks, MealState } from '../../types';

export interface FoodItemElements {
	container: HTMLElement;
	checkboxEl: HTMLInputElement;
	nameEl: HTMLElement;
}

export function renderFoodItem(
	container: HTMLElement,
	food: FoodItem,
	index: number,
	callbacks: MealLogCallbacks,
	mealState: MealState
): FoodItemElements {
	const foodEl = container.createDiv({
		cls: `meal-food-item state-${food.state}`
	});

	const contentRow = foodEl.createDiv({ cls: 'meal-food-content' });

	// Checkbox
	const checkboxEl = contentRow.createEl('input', {
		type: 'checkbox',
		cls: 'meal-food-checkbox'
	});
	checkboxEl.checked = food.state === 'completed';
	checkboxEl.disabled = mealState === 'completed';

	checkboxEl.addEventListener('change', async () => {
		await callbacks.onFoodToggle(index);
	});

	// Food name
	const nameEl = contentRow.createDiv({ cls: 'meal-food-name' });
	nameEl.setText(food.name);

	// Remove button (only if not completed)
	if (mealState !== 'completed') {
		const removeBtn = contentRow.createEl('button', {
			cls: 'meal-food-remove-btn',
			text: '✕'
		});
		removeBtn.addEventListener('click', async (e) => {
			e.preventDefault();
			await callbacks.onRemoveFood(index);
		});
	}

	return { container: foodEl, checkboxEl, nameEl };
}
