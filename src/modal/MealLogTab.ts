import { App, TFile } from 'obsidian';
import { LifeLogSettings, MealType } from '../types';
import { FileCreator } from '../file/creator';

export interface MealLogTabContext {
	app: App;
	settings: LifeLogSettings;
	fileCreator: FileCreator;
	onCreated: (file: TFile) => void;
}

interface MealTypeOption {
	type: MealType;
	label: string;
	icon: string;
}

export class MealLogTab {
	private container: HTMLElement;
	private ctx: MealLogTabContext;
	private selectedMealType: MealType | null = null;
	private foodInputs: HTMLInputElement[] = [];

	private static readonly MEAL_TYPES: MealTypeOption[] = [
		{ type: 'breakfast', label: '아침', icon: '🌅' },
		{ type: 'lunch', label: '점심', icon: '☀️' },
		{ type: 'dinner', label: '저녁', icon: '🌙' },
		{ type: 'snack', label: '간식', icon: '🍪' },
	];

	constructor(container: HTMLElement, ctx: MealLogTabContext) {
		this.container = container;
		this.ctx = ctx;

		// 현재 시간에 따라 기본 식사 타입 설정
		const hour = new Date().getHours();
		if (hour >= 6 && hour < 11) {
			this.selectedMealType = 'breakfast';
		} else if (hour >= 11 && hour < 15) {
			this.selectedMealType = 'lunch';
		} else if (hour >= 15 && hour < 21) {
			this.selectedMealType = 'dinner';
		} else {
			this.selectedMealType = 'snack';
		}
	}

	render(): void {
		this.container.empty();
		this.container.addClass('meal-log-tab');

		this.renderMealTypeSelector();
		this.renderFoodInput();
		this.renderCreateButton();
	}

	private renderMealTypeSelector(): void {
		const section = this.container.createDiv({ cls: 'tab-section' });
		section.createEl('label', { text: '식사 종류', cls: 'tab-label' });

		const mealTypeGrid = section.createDiv({ cls: 'meal-type-grid' });

		for (const mealOption of MealLogTab.MEAL_TYPES) {
			const btn = mealTypeGrid.createEl('button', {
				cls: `meal-type-btn ${this.selectedMealType === mealOption.type ? 'selected' : ''}`
			});
			btn.createSpan({ text: mealOption.icon, cls: 'meal-type-icon' });
			btn.createSpan({ text: mealOption.label, cls: 'meal-type-label' });

			btn.addEventListener('click', () => {
				this.selectedMealType = mealOption.type;
				mealTypeGrid.querySelectorAll('.meal-type-btn').forEach(el => {
					el.classList.remove('selected');
				});
				btn.classList.add('selected');
			});
		}
	}

	private renderFoodInput(): void {
		const section = this.container.createDiv({ cls: 'tab-section' });
		section.createEl('label', { text: '음식 목록', cls: 'tab-label' });

		const foodList = section.createDiv({ cls: 'food-input-list' });

		this.addFoodInputRow(foodList);

		const addBtn = section.createEl('button', { cls: 'add-food-btn', text: '+ 음식 추가' });
		addBtn.addEventListener('click', () => {
			this.addFoodInputRow(foodList);
		});
	}

	private addFoodInputRow(container: HTMLElement): void {
		const row = container.createDiv({ cls: 'food-input-row' });

		const nameInput = row.createEl('input', {
			type: 'text',
			placeholder: '음식 이름 (예: 현미밥, 된장찌개)',
			cls: 'food-name-input'
		});
		this.foodInputs.push(nameInput);

		const removeBtn = row.createEl('button', { cls: 'food-remove-btn', text: '×' });
		removeBtn.addEventListener('click', () => {
			const idx = this.foodInputs.indexOf(nameInput);
			if (idx > -1) this.foodInputs.splice(idx, 1);
			row.remove();
		});

		nameInput.focus();
	}

	private renderCreateButton(): void {
		const section = this.container.createDiv({ cls: 'tab-section tab-actions' });

		const createBtn = section.createEl('button', {
			cls: 'create-btn primary',
			text: '식단 기록 생성'
		});

		createBtn.addEventListener('click', () => this.createMealLog());
	}

	private async createMealLog(): Promise<void> {
		if (!this.selectedMealType) {
			return;
		}

		const foods = this.collectFoods();

		const codeBlockContent = this.buildCodeBlockContent(foods);

		const file = await this.ctx.fileCreator.createLogFile('meal', codeBlockContent);
		this.ctx.onCreated(file);
	}

	private collectFoods(): string[] {
		const foods: string[] = [];

		for (const input of this.foodInputs) {
			if (input.value.trim()) {
				foods.push(input.value.trim());
			}
		}

		return foods;
	}

	private buildCodeBlockContent(foods: string[]): string {
		const lines: string[] = [];
		const mealOption = MealLogTab.MEAL_TYPES.find(m => m.type === this.selectedMealType);

		lines.push(`title: ${mealOption?.label || '식사'}`);
		lines.push(`mealType: ${this.selectedMealType}`);
		lines.push('state: planned');
		lines.push('---');

		for (const food of foods) {
			lines.push(`- [ ] ${food}`);
		}

		// 음식이 없어도 빈 목록으로 생성
		if (foods.length === 0) {
			lines.push('- [ ] 음식을 추가하세요');
		}

		return lines.join('\n');
	}
}
