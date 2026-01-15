import { App, Modal } from 'obsidian';

export interface SelfEvalResult {
	focusScore: number;
	comprehensionScore: number;
	notes?: string;
}

export class SelfEvalModal extends Modal {
	private focusScore: number = 4;
	private comprehensionScore: number = 4;
	private notes: string = '';
	private onSubmit: (result: SelfEvalResult) => void;

	constructor(app: App, onSubmit: (result: SelfEvalResult) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('self-eval-modal');

		contentEl.createEl('h2', { text: '🎉 학습 완료! 자가평가를 해주세요' });

		this.renderFocusScore(contentEl);
		this.renderComprehensionScore(contentEl);
		this.renderNotesInput(contentEl);
		this.renderButtons(contentEl);
	}

	private renderFocusScore(container: HTMLElement): void {
		const focusSection = container.createDiv({ cls: 'eval-section' });
		focusSection.createEl('label', { text: '집중도', cls: 'eval-label' });
		
		const starsContainer = focusSection.createDiv({ cls: 'eval-stars' });
		this.renderStarPicker(starsContainer, this.focusScore, (score) => {
			this.focusScore = score;
		});
	}

	private renderComprehensionScore(container: HTMLElement): void {
		const compSection = container.createDiv({ cls: 'eval-section' });
		compSection.createEl('label', { text: '이해도', cls: 'eval-label' });
		
		const starsContainer = compSection.createDiv({ cls: 'eval-stars' });
		this.renderStarPicker(starsContainer, this.comprehensionScore, (score) => {
			this.comprehensionScore = score;
		});
	}

	private renderStarPicker(
		container: HTMLElement,
		initialValue: number,
		onChange: (score: number) => void
	): void {
		for (let i = 1; i <= 5; i++) {
			const star = container.createSpan({
				cls: `eval-star ${i <= initialValue ? 'filled' : ''}`,
				text: i <= initialValue ? '★' : '☆'
			});
			
			star.addEventListener('click', () => {
				onChange(i);
				container.querySelectorAll('.eval-star').forEach((el, idx) => {
					const starEl = el as HTMLElement;
					if (idx < i) {
						starEl.textContent = '★';
						starEl.classList.add('filled');
					} else {
						starEl.textContent = '☆';
						starEl.classList.remove('filled');
					}
				});
			});

			star.addEventListener('mouseenter', () => {
				container.querySelectorAll('.eval-star').forEach((el, idx) => {
					const starEl = el as HTMLElement;
					if (idx < i) {
						starEl.classList.add('hover');
					}
				});
			});

			star.addEventListener('mouseleave', () => {
				container.querySelectorAll('.eval-star').forEach((el) => {
					el.classList.remove('hover');
				});
			});
		}
	}

	private renderNotesInput(container: HTMLElement): void {
		const notesSection = container.createDiv({ cls: 'eval-section' });
		notesSection.createEl('label', { text: '메모 (선택)', cls: 'eval-label' });
		
		const input = notesSection.createEl('textarea', {
			cls: 'eval-notes-input',
			placeholder: '오늘 학습에 대한 짧은 메모...'
		});
		input.rows = 3;
		input.addEventListener('input', () => {
			this.notes = input.value;
		});
	}

	private renderButtons(container: HTMLElement): void {
		const btnContainer = container.createDiv({ cls: 'eval-buttons' });

		const cancelBtn = btnContainer.createEl('button', {
			cls: 'eval-btn eval-btn-secondary',
			text: '취소'
		});
		cancelBtn.addEventListener('click', () => this.close());

		const submitBtn = btnContainer.createEl('button', {
			cls: 'eval-btn eval-btn-primary',
			text: '저장하고 종료'
		});
		submitBtn.addEventListener('click', () => {
			this.onSubmit({
				focusScore: this.focusScore,
				comprehensionScore: this.comprehensionScore,
				notes: this.notes || undefined
			});
			this.close();
		});
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}
