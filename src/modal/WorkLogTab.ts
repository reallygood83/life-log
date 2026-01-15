import { App, TFile } from 'obsidian';
import { LifeLogSettings, WorkPriority } from '../types';
import { FileCreator } from '../file/creator';

export interface WorkLogTabContext {
	app: App;
	settings: LifeLogSettings;
	fileCreator: FileCreator;
	onCreated: (file: TFile) => void;
}

interface TaskInput {
	name: string;
	priority: WorkPriority;
	expectedDuration: string;
}

const PRIORITY_COLORS: Record<WorkPriority, string> = {
	high: '#E74C3C',
	medium: '#F39C12',
	low: '#3498DB'
};

export class WorkLogTab {
	private container: HTMLElement;
	private ctx: WorkLogTabContext;

	constructor(container: HTMLElement, ctx: WorkLogTabContext) {
		this.container = container;
		this.ctx = ctx;
	}

	render(): void {
		this.container.empty();
		this.container.addClass('work-log-tab');

		this.renderTitleInput();
		this.renderTaskInput();
		this.renderCreateButton();
	}

	private renderTitleInput(): void {
		const section = this.container.createDiv({ cls: 'tab-section' });
		section.createEl('label', { text: '업무 제목', cls: 'tab-label' });

		const input = section.createEl('input', {
			type: 'text',
			placeholder: '예: 오전 업무, 프로젝트 A',
			cls: 'work-title-input'
		});

		const now = new Date();
		const hours = now.getHours();
		const period = hours < 12 ? '오전' : (hours < 18 ? '오후' : '저녁');
		input.value = `${period} 업무`;
	}

	private renderTaskInput(): void {
		const section = this.container.createDiv({ cls: 'tab-section' });
		section.createEl('label', { text: '업무 항목', cls: 'tab-label' });

		const taskList = section.createDiv({ cls: 'work-task-input-list' });
		
		this.addTaskInputRow(taskList);

		const addBtn = section.createEl('button', { cls: 'add-task-btn', text: '+ 업무 추가' });
		addBtn.addEventListener('click', () => {
			this.addTaskInputRow(taskList);
		});
	}

	private addTaskInputRow(container: HTMLElement): void {
		const row = container.createDiv({ cls: 'work-task-input-row' });

		const nameInput = row.createEl('input', {
			type: 'text',
			placeholder: '업무 내용 (예: 기획서 작성)',
			cls: 'work-task-name-input'
		});

		const prioritySelect = row.createEl('select', { cls: 'work-task-priority-select' });
		const priorities: { value: WorkPriority; label: string }[] = [
			{ value: 'high', label: '높음' },
			{ value: 'medium', label: '보통' },
			{ value: 'low', label: '낮음' }
		];
		
		for (const p of priorities) {
			const option = prioritySelect.createEl('option', {
				value: p.value,
				text: p.label
			});
			if (p.value === 'medium') option.selected = true;
		}

		prioritySelect.addEventListener('change', () => {
			const color = PRIORITY_COLORS[prioritySelect.value as WorkPriority];
			prioritySelect.style.borderColor = color;
		});

		const durationInput = row.createEl('input', {
			type: 'text',
			placeholder: '예상 시간 (예: 2h)',
			cls: 'work-task-duration-input'
		});
		durationInput.value = '1h';

		const removeBtn = row.createEl('button', { cls: 'work-task-remove-btn', text: '×' });
		removeBtn.addEventListener('click', () => {
			row.remove();
		});

		nameInput.focus();
	}

	private renderCreateButton(): void {
		const section = this.container.createDiv({ cls: 'tab-section tab-actions' });

		const createBtn = section.createEl('button', {
			cls: 'create-btn primary',
			text: '업무 기록 생성'
		});

		createBtn.addEventListener('click', () => this.createWorkLog());
	}

	private async createWorkLog(): Promise<void> {
		const tasks = this.collectTasks();
		if (tasks.length === 0) {
			return;
		}

		const titleInput = this.container.querySelector('.work-title-input') as HTMLInputElement;
		const title = titleInput?.value.trim() || '업무';

		const codeBlockContent = this.buildCodeBlockContent(title, tasks);
		
		const file = await this.ctx.fileCreator.createLogFile('work', codeBlockContent);
		this.ctx.onCreated(file);
	}

	private collectTasks(): TaskInput[] {
		const tasks: TaskInput[] = [];
		const rows = this.container.querySelectorAll('.work-task-input-row');

		rows.forEach((row) => {
			const nameInput = row.querySelector('.work-task-name-input') as HTMLInputElement;
			const prioritySelect = row.querySelector('.work-task-priority-select') as HTMLSelectElement;
			const durationInput = row.querySelector('.work-task-duration-input') as HTMLInputElement;

			if (nameInput?.value.trim()) {
				tasks.push({
					name: nameInput.value.trim(),
					priority: (prioritySelect?.value as WorkPriority) || 'medium',
					expectedDuration: durationInput?.value.trim() || '1h'
				});
			}
		});

		return tasks;
	}

	private buildCodeBlockContent(title: string, tasks: TaskInput[]): string {
		const lines: string[] = [];

		lines.push(`title: ${title}`);
		lines.push('state: planned');
		lines.push('---');

		for (const task of tasks) {
			lines.push(`- [ ] ${task.name} | Priority: ${task.priority} | Expected: [${task.expectedDuration}]`);
		}

		return lines.join('\n');
	}
}
