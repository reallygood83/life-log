import { MealState, MealLogCallbacks, ParsedMealLog } from '../../types';

export function renderMealControls(
	container: HTMLElement,
	mealState: MealState,
	callbacks: MealLogCallbacks,
	parsed: ParsedMealLog
): void {
	const controlsEl = container.createDiv({ cls: 'meal-controls' });

	if (mealState === 'completed') {
		renderCompletedState(controlsEl);
		return;
	}

	// Add food input
	const addFoodContainer = controlsEl.createDiv({ cls: 'meal-add-food' });
	const foodInput = addFoodContainer.createEl('input', {
		type: 'text',
		cls: 'meal-food-input',
		placeholder: '음식 이름을 입력하세요...'
	});
	const addBtn = addFoodContainer.createEl('button', {
		cls: 'meal-add-btn',
		text: '➕ 추가'
	});

	const handleAddFood = async () => {
		const foodName = foodInput.value.trim();
		if (foodName) {
			await callbacks.onAddFood(foodName);
			foodInput.value = '';
		}
	};

	addBtn.addEventListener('click', handleAddFood);
	foodInput.addEventListener('keypress', async (e) => {
		if (e.key === 'Enter') {
			await handleAddFood();
		}
	});

	// Complete button
	if (parsed.foods.length > 0) {
		const completeBtn = controlsEl.createEl('button', {
			cls: 'meal-complete-btn',
			text: '✓ 식사 완료'
		});

		completeBtn.addEventListener('click', async () => {
			await callbacks.onCompleteMeal();
		});
	}
}

function renderCompletedState(container: HTMLElement): void {
	const completedEl = container.createDiv({ cls: 'meal-completed-badge' });
	completedEl.createSpan({ cls: 'meal-completed-icon', text: '✓' });
	completedEl.createSpan({ cls: 'meal-completed-text', text: '식사 완료' });
}
