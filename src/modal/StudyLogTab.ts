import { App, TFile } from 'obsidian';
import { SubjectPreset, LifeLogSettings } from '../types';
import { FileCreator } from '../file/creator';

export interface StudyLogTabContext {
	app: App;
	settings: LifeLogSettings;
	fileCreator: FileCreator;
	onCreated: (file: TFile) => void;
}

export class StudyLogTab {
	private container: HTMLElement;
	private ctx: StudyLogTabContext;
	private selectedSubject: SubjectPreset | null = null;
	private taskInputs: HTMLInputElement[] = [];

	constructor(container: HTMLElement, ctx: StudyLogTabContext) {
		this.container = container;
		this.ctx = ctx;
	}

	render(): void {
		this.container.empty();
		this.container.addClass('study-log-tab');

		this.renderSubjectSelector();
		this.renderTaskInput();
		this.renderCreateButton();
	}

	private renderSubjectSelector(): void {
		const section = this.container.createDiv({ cls: 'tab-section' });
		section.createEl('label', { text: '과목 선택', cls: 'tab-label' });

		const subjectGrid = section.createDiv({ cls: 'subject-grid' });

		for (const subject of this.ctx.settings.subjects) {
			const btn = subjectGrid.createEl('button', {
				cls: `subject-btn ${this.selectedSubject?.name === subject.name ? 'selected' : ''}`
			});
			btn.style.setProperty('--subject-color', subject.color);
			btn.createSpan({ text: subject.name, cls: 'subject-name' });

			btn.addEventListener('click', () => {
				this.selectedSubject = subject;
				subjectGrid.querySelectorAll('.subject-btn').forEach(el => {
					el.classList.remove('selected');
				});
				btn.classList.add('selected');
			});
		}

		const addNewBtn = subjectGrid.createEl('button', { cls: 'subject-btn subject-btn-add' });
		addNewBtn.createSpan({ text: '+' });
		addNewBtn.createSpan({ text: '직접 입력' });
		addNewBtn.addEventListener('click', () => {
			this.showCustomSubjectInput(section);
		});
	}

	private showCustomSubjectInput(parentSection: HTMLElement): void {
		const existingInput = parentSection.querySelector('.custom-subject-input');
		if (existingInput) return;

		const inputWrapper = parentSection.createDiv({ cls: 'custom-subject-input' });
		const input = inputWrapper.createEl('input', {
			type: 'text',
			placeholder: '과목명 입력...'
		});
		input.focus();

		input.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' && input.value.trim()) {
				this.selectedSubject = {
					name: input.value.trim(),
					icon: '',
					color: '#808080'
				};
				inputWrapper.remove();
				this.render();
			} else if (e.key === 'Escape') {
				inputWrapper.remove();
			}
		});
	}

	private renderTaskInput(): void {
		const section = this.container.createDiv({ cls: 'tab-section' });
		section.createEl('label', { text: '학습 항목', cls: 'tab-label' });

		const taskList = section.createDiv({ cls: 'task-input-list' });
		
		this.addTaskInputRow(taskList);

		const addBtn = section.createEl('button', { cls: 'add-task-btn', text: '+ 항목 추가' });
		addBtn.addEventListener('click', () => {
			this.addTaskInputRow(taskList);
		});
	}

	private addTaskInputRow(container: HTMLElement): void {
		const row = container.createDiv({ cls: 'task-input-row' });

		const nameInput = row.createEl('input', {
			type: 'text',
			placeholder: '학습 항목 (예: Chapter 3 복습)',
			cls: 'task-name-input'
		});
		this.taskInputs.push(nameInput);

		const durationInput = row.createEl('input', {
			type: 'text',
			placeholder: '목표 시간 (예: 30m)',
			cls: 'task-duration-input'
		});
		durationInput.value = `${this.ctx.settings.defaultStudyDuration}m`;

		const removeBtn = row.createEl('button', { cls: 'task-remove-btn', text: '×' });
		removeBtn.addEventListener('click', () => {
			const idx = this.taskInputs.indexOf(nameInput);
			if (idx > -1) this.taskInputs.splice(idx, 1);
			row.remove();
		});

		nameInput.focus();
	}

	private renderCreateButton(): void {
		const section = this.container.createDiv({ cls: 'tab-section tab-actions' });

		const createBtn = section.createEl('button', {
			cls: 'create-btn primary',
			text: '학습 기록 생성'
		});

		createBtn.addEventListener('click', () => this.createStudyLog());
	}

	private async createStudyLog(): Promise<void> {
		if (!this.selectedSubject) {
			return;
		}

		const tasks = this.collectTasks();
		if (tasks.length === 0) {
			return;
		}

		const codeBlockContent = this.buildCodeBlockContent(tasks);
		
		const file = await this.ctx.fileCreator.createLogFile('study', codeBlockContent);
		this.ctx.onCreated(file);
	}

	private collectTasks(): { name: string; duration: string }[] {
		const tasks: { name: string; duration: string }[] = [];
		const rows = this.container.querySelectorAll('.task-input-row');

		rows.forEach((row) => {
			const nameInput = row.querySelector('.task-name-input') as HTMLInputElement;
			const durationInput = row.querySelector('.task-duration-input') as HTMLInputElement;

			if (nameInput?.value.trim()) {
				tasks.push({
					name: nameInput.value.trim(),
					duration: durationInput?.value.trim() || `${this.ctx.settings.defaultStudyDuration}m`
				});
			}
		});

		return tasks;
	}

	private buildCodeBlockContent(tasks: { name: string; duration: string }[]): string {
		const lines: string[] = [];
		const now = new Date();
		const hours = now.getHours();
		const period = hours < 12 ? '오전' : (hours < 18 ? '오후' : '저녁');

		lines.push(`title: ${period} 학습`);
		lines.push(`subject: ${this.selectedSubject?.name || '기타'}`);
		lines.push('state: planned');
		lines.push('---');

		for (const task of tasks) {
			lines.push(`- [ ] ${task.name} | Duration: [${task.duration}]`);
		}

		return lines.join('\n');
	}
}
