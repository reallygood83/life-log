import { App, TFile } from 'obsidian';
import { LifeLogSettings } from '../types';
import { FileCreator } from '../file/creator';

export interface WorkoutLogTabContext {
	app: App;
	settings: LifeLogSettings;
	fileCreator: FileCreator;
	onCreated: (file: TFile) => void;
}

interface ExerciseInput {
	name: string;
	params: string;
}

export class WorkoutLogTab {
	private container: HTMLElement;
	private ctx: WorkoutLogTabContext;
	private exerciseInputs: ExerciseInput[] = [];

	constructor(container: HTMLElement, ctx: WorkoutLogTabContext) {
		this.container = container;
		this.ctx = ctx;
	}

	render(): void {
		this.container.empty();
		this.container.addClass('workout-log-tab');

		this.renderTitleInput();
		this.renderExerciseInput();
		this.renderQuickTemplates();
		this.renderCreateButton();
	}

	private renderTitleInput(): void {
		const section = this.container.createDiv({ cls: 'tab-section' });
		section.createEl('label', { text: '운동 이름', cls: 'tab-label' });

		const input = section.createEl('input', {
			type: 'text',
			placeholder: '예: 아침 운동, 상체 운동',
			cls: 'workout-title-input'
		});

		const now = new Date();
		const hours = now.getHours();
		const period = hours < 12 ? '아침' : (hours < 18 ? '오후' : '저녁');
		input.value = `${period} 운동`;
	}

	private renderExerciseInput(): void {
		const section = this.container.createDiv({ cls: 'tab-section' });
		section.createEl('label', { text: '운동 항목', cls: 'tab-label' });

		const exerciseList = section.createDiv({ cls: 'exercise-input-list' });
		
		this.addExerciseInputRow(exerciseList);

		const addBtn = section.createEl('button', { cls: 'add-exercise-btn', text: '+ 운동 추가' });
		addBtn.addEventListener('click', () => {
			this.addExerciseInputRow(exerciseList);
		});
	}

	private addExerciseInputRow(container: HTMLElement): void {
		const row = container.createDiv({ cls: 'exercise-input-row' });

		const nameInput = row.createEl('input', {
			type: 'text',
			placeholder: '운동명 (예: 스쿼트)',
			cls: 'exercise-name-input'
		});

		const paramsInput = row.createEl('input', {
			type: 'text',
			placeholder: '무게: [60]kg | 횟수: [10]',
			cls: 'exercise-params-input'
		});

		const removeBtn = row.createEl('button', { cls: 'exercise-remove-btn', text: '×' });
		removeBtn.addEventListener('click', () => {
			row.remove();
		});

		nameInput.focus();
	}

	private renderQuickTemplates(): void {
		const section = this.container.createDiv({ cls: 'tab-section' });
		section.createEl('label', { text: '빠른 템플릿', cls: 'tab-label' });

		const templateGrid = section.createDiv({ cls: 'template-grid' });

		const defaultTemplates = [
			{ name: '상체 운동', exercises: [
				{ name: '푸시업', params: '횟수: [15]' },
				{ name: '덤벨 로우', params: '무게: [10]kg | 횟수: [12]' },
				{ name: '숄더 프레스', params: '무게: [8]kg | 횟수: [10]' }
			]},
			{ name: '하체 운동', exercises: [
				{ name: '스쿼트', params: '무게: [40]kg | 횟수: [12]' },
				{ name: '런지', params: '횟수: [10] /다리' },
				{ name: '카프레이즈', params: '횟수: [20]' }
			]},
			{ name: 'HIIT', exercises: [
				{ name: '버피', params: '시간: [30초]' },
				{ name: '점핑잭', params: '시간: [30초]' },
				{ name: '마운틴 클라이머', params: '시간: [30초]' }
			]},
		];
		
		const templates = this.ctx.settings.workoutTemplates?.length > 0 
			? this.ctx.settings.workoutTemplates 
			: defaultTemplates;

		for (const template of templates) {
			const btn = templateGrid.createEl('button', { cls: 'template-btn' });
			btn.createSpan({ text: template.name });

			btn.addEventListener('click', () => {
				this.applyTemplate(template);
			});
		}
	}

	private applyTemplate(template: { name: string; exercises: ExerciseInput[] }): void {
		const titleInput = this.container.querySelector('.workout-title-input') as HTMLInputElement;
		if (titleInput) {
			titleInput.value = template.name;
		}

		const exerciseList = this.container.querySelector('.exercise-input-list');
		if (exerciseList) {
			exerciseList.empty();
			for (const exercise of template.exercises) {
				this.addExerciseInputRowWithData(exerciseList as HTMLElement, exercise);
			}
		}
	}

	private addExerciseInputRowWithData(container: HTMLElement, data: ExerciseInput): void {
		const row = container.createDiv({ cls: 'exercise-input-row' });

		const nameInput = row.createEl('input', {
			type: 'text',
			placeholder: '운동명',
			cls: 'exercise-name-input'
		});
		nameInput.value = data.name;

		const paramsInput = row.createEl('input', {
			type: 'text',
			placeholder: '파라미터',
			cls: 'exercise-params-input'
		});
		paramsInput.value = data.params;

		const removeBtn = row.createEl('button', { cls: 'exercise-remove-btn', text: '×' });
		removeBtn.addEventListener('click', () => {
			row.remove();
		});
	}

	private renderCreateButton(): void {
		const section = this.container.createDiv({ cls: 'tab-section tab-actions' });

		const createBtn = section.createEl('button', {
			cls: 'create-btn primary',
			text: '운동 기록 생성'
		});

		createBtn.addEventListener('click', () => this.createWorkoutLog());
	}

	private async createWorkoutLog(): Promise<void> {
		const exercises = this.collectExercises();
		if (exercises.length === 0) {
			return;
		}

		const titleInput = this.container.querySelector('.workout-title-input') as HTMLInputElement;
		const title = titleInput?.value.trim() || '운동';

		const codeBlockContent = this.buildCodeBlockContent(title, exercises);
		
		const file = await this.ctx.fileCreator.createLogFile('workout', codeBlockContent);
		this.ctx.onCreated(file);
	}

	private collectExercises(): ExerciseInput[] {
		const exercises: ExerciseInput[] = [];
		const rows = this.container.querySelectorAll('.exercise-input-row');

		rows.forEach((row) => {
			const nameInput = row.querySelector('.exercise-name-input') as HTMLInputElement;
			const paramsInput = row.querySelector('.exercise-params-input') as HTMLInputElement;

			if (nameInput?.value.trim()) {
				exercises.push({
					name: nameInput.value.trim(),
					params: paramsInput?.value.trim() || ''
				});
			}
		});

		return exercises;
	}

	private buildCodeBlockContent(title: string, exercises: ExerciseInput[]): string {
		const lines: string[] = [];

		lines.push(`title: ${title}`);
		lines.push('state: planned');
		lines.push('startDate:');
		lines.push('duration:');
		lines.push(`restDuration: ${this.ctx.settings.defaultRestDuration}s`);
		lines.push('---');

		for (const exercise of exercises) {
			if (exercise.params) {
				lines.push(`- [ ] ${exercise.name} | ${exercise.params}`);
			} else {
				lines.push(`- [ ] ${exercise.name}`);
			}
		}

		return lines.join('\n');
	}
}
