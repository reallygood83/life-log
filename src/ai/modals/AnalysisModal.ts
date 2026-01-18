import { App, Modal, Notice, MarkdownRenderer, Component } from 'obsidian';
import {
	LogCategory,
	AnalysisTemplate,
	AIProviderType,
	AIAnalysisSettings,
	DateRange,
	AnalysisDataRange,
} from '../../types';
import { getTemplatesByCategory, DEFAULT_TEMPLATES } from '../templates';
import { TemplateEngine } from '../templates/engine';
import { AIAnalysisEngine, AnalysisProgress } from '../engine';

/**
 * AI 분석 모달
 */
export class AIAnalysisModal extends Modal {
	private settings: AIAnalysisSettings;
	private logFolder: string;
	private engine: AIAnalysisEngine;

	// 선택 상태
	private selectedCategory: LogCategory = 'study';
	private selectedTemplate: AnalysisTemplate | null = null;
	private selectedProvider: AIProviderType;
	private selectedDataRange: AnalysisDataRange = 'week';
	private customDays: number = 7;

	// UI 요소
	private resultContainer: HTMLElement | null = null;
	private progressContainer: HTMLElement | null = null;
	private renderComponent: Component;

	constructor(app: App, settings: AIAnalysisSettings, logFolder: string) {
		super(app);
		this.settings = settings;
		this.logFolder = logFolder;
		this.selectedProvider = settings.defaultProvider;
		this.engine = new AIAnalysisEngine(app, settings, logFolder);
		this.renderComponent = new Component();
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('ai-analysis-modal');
		this.renderComponent.load();

		// 헤더
		contentEl.createEl('h2', { text: '🤖 AI 분석' });

		// 카테고리 선택
		this.renderCategorySelector(contentEl);

		// 템플릿 선택
		this.renderTemplateSelector(contentEl);

		// 기간 선택
		this.renderDateRangeSelector(contentEl);

		// Provider 선택
		this.renderProviderSelector(contentEl);

		// 진행 상태
		this.progressContainer = contentEl.createDiv({ cls: 'analysis-progress hidden' });

		// 결과 영역
		this.resultContainer = contentEl.createDiv({ cls: 'analysis-result hidden' });

		// 버튼
		this.renderButtons(contentEl);
	}

	private renderCategorySelector(container: HTMLElement): void {
		const section = container.createDiv({ cls: 'analysis-section' });
		section.createEl('label', { text: '분석 대상', cls: 'analysis-label' });

		const categories: { value: LogCategory; label: string; icon: string }[] = [
			{ value: 'study', label: '학습', icon: '📚' },
			{ value: 'workout', label: '운동', icon: '💪' },
			{ value: 'work', label: '업무', icon: '💼' },
			{ value: 'meal', label: '식단', icon: '🍽️' },
		];

		const btnGroup = section.createDiv({ cls: 'category-btn-group' });

		for (const cat of categories) {
			const btn = btnGroup.createEl('button', {
				cls: `category-btn ${this.selectedCategory === cat.value ? 'active' : ''}`,
				text: `${cat.icon} ${cat.label}`,
			});
			btn.addEventListener('click', () => {
				this.selectedCategory = cat.value;
				this.selectedTemplate = null;
				btnGroup.querySelectorAll('.category-btn').forEach(b => b.removeClass('active'));
				btn.addClass('active');
				this.updateTemplateList();
			});
		}
	}

	private renderTemplateSelector(container: HTMLElement): void {
		const section = container.createDiv({ cls: 'analysis-section template-section' });
		section.createEl('label', { text: '분석 템플릿', cls: 'analysis-label' });

		const templateList = section.createDiv({ cls: 'template-list' });
		templateList.id = 'template-list';

		this.updateTemplateList();
	}

	private updateTemplateList(): void {
		const listEl = document.getElementById('template-list');
		if (!listEl) return;

		listEl.empty();

		const templates = getTemplatesByCategory(this.selectedCategory);
		const enabledIds = this.settings.enabledTemplates;

		for (const template of templates) {
			if (!enabledIds.includes(template.id)) continue;

			const item = listEl.createDiv({
				cls: `template-item ${this.selectedTemplate?.id === template.id ? 'selected' : ''}`,
			});

			const title = item.createDiv({ cls: 'template-title', text: template.name });
			const desc = item.createDiv({ cls: 'template-desc', text: template.description });

			item.addEventListener('click', () => {
				this.selectedTemplate = template;
				listEl.querySelectorAll('.template-item').forEach(i => i.removeClass('selected'));
				item.addClass('selected');
			});
		}

		// 첫 번째 템플릿 자동 선택
		if (templates.length > 0 && !this.selectedTemplate) {
			const firstEnabled = templates.find(t => enabledIds.includes(t.id));
			if (firstEnabled) {
				this.selectedTemplate = firstEnabled;
				const firstItem = listEl.querySelector('.template-item');
				firstItem?.addClass('selected');
			}
		}
	}

	private renderDateRangeSelector(container: HTMLElement): void {
		const section = container.createDiv({ cls: 'analysis-section' });
		section.createEl('label', { text: '분석 기간', cls: 'analysis-label' });

		const ranges: { value: AnalysisDataRange; label: string }[] = [
			{ value: 'day', label: '오늘' },
			{ value: 'week', label: '최근 7일' },
			{ value: 'month', label: '최근 30일' },
			{ value: 'quarter', label: '최근 90일' },
			{ value: 'custom', label: '직접 입력' },
		];

		const selectEl = section.createEl('select', { cls: 'analysis-select' });
		for (const range of ranges) {
			const option = selectEl.createEl('option', {
				text: range.label,
				value: range.value,
			});
			if (range.value === this.selectedDataRange) {
				option.selected = true;
			}
		}

		const customInputContainer = section.createDiv({
			cls: `custom-days-container ${this.selectedDataRange !== 'custom' ? 'hidden' : ''}`,
		});
		const customInput = customInputContainer.createEl('input', {
			type: 'number',
			cls: 'custom-days-input',
			value: String(this.customDays),
			placeholder: '일수',
		});
		customInputContainer.createSpan({ text: '일' });

		selectEl.addEventListener('change', () => {
			this.selectedDataRange = selectEl.value as AnalysisDataRange;
			if (this.selectedDataRange === 'custom') {
				customInputContainer.removeClass('hidden');
			} else {
				customInputContainer.addClass('hidden');
			}
		});

		customInput.addEventListener('change', () => {
			this.customDays = parseInt(customInput.value) || 7;
		});
	}

	private renderProviderSelector(container: HTMLElement): void {
		const section = container.createDiv({ cls: 'analysis-section' });
		section.createEl('label', { text: 'AI Provider', cls: 'analysis-label' });

		const providers = this.engine.getAvailableProviders();

		const selectEl = section.createEl('select', { cls: 'analysis-select' });
		for (const provider of providers) {
			const label = provider.configured
				? provider.name
				: `${provider.name} (API 키 필요)`;

			const option = selectEl.createEl('option', {
				text: label,
				value: provider.type,
			});
			option.disabled = !provider.configured;

			if (provider.type === this.selectedProvider && provider.configured) {
				option.selected = true;
			}
		}

		// 선택된 provider가 설정되지 않은 경우 첫 번째 설정된 provider 선택
		const configuredProvider = providers.find(p => p.configured);
		if (configuredProvider) {
			this.selectedProvider = configuredProvider.type as AIProviderType;
			for (let i = 0; i < selectEl.options.length; i++) {
				const opt = selectEl.options[i];
				if (opt && opt.value === this.selectedProvider) {
					opt.selected = true;
					break;
				}
			}
		}

		selectEl.addEventListener('change', () => {
			this.selectedProvider = selectEl.value as AIProviderType;
		});
	}

	private renderButtons(container: HTMLElement): void {
		const btnContainer = container.createDiv({ cls: 'analysis-buttons' });

		const cancelBtn = btnContainer.createEl('button', {
			cls: 'analysis-btn analysis-btn-secondary',
			text: '취소',
		});
		cancelBtn.addEventListener('click', () => this.close());

		const analyzeBtn = btnContainer.createEl('button', {
			cls: 'analysis-btn analysis-btn-primary',
			text: '🚀 분석 시작',
		});
		analyzeBtn.id = 'analyze-btn';
		analyzeBtn.addEventListener('click', () => this.startAnalysis());
	}

	private async startAnalysis(): Promise<void> {
		if (!this.selectedTemplate) {
			new Notice('분석 템플릿을 선택해주세요.');
			return;
		}

		// Provider 확인
		const providers = this.engine.getAvailableProviders();
		const provider = providers.find(p => p.type === this.selectedProvider);
		if (!provider?.configured) {
			new Notice(`${provider?.name || 'AI'} API 키를 설정해주세요.`);
			return;
		}

		// 버튼 비활성화
		const analyzeBtn = document.getElementById('analyze-btn') as HTMLButtonElement;
		if (analyzeBtn) {
			analyzeBtn.disabled = true;
			analyzeBtn.textContent = '분석 중...';
		}

		// 진행 상태 표시
		this.showProgress();

		// 날짜 범위 계산
		const dateRange = TemplateEngine.calculateDateRange(
			this.selectedDataRange,
			this.customDays
		);

		try {
			const result = await this.engine.analyze(
				{
					category: this.selectedCategory,
					template: this.selectedTemplate,
					dateRange,
					providerType: this.selectedProvider,
				},
				(progress) => this.updateProgress(progress)
			);

			if (result.success) {
				this.showResult(result.content);
				new Notice('분석이 완료되었습니다!');
			} else {
				this.showError(result.error || '분석 중 오류가 발생했습니다.');
				new Notice(`분석 실패: ${result.error}`);
			}
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : '알 수 없는 오류';
			this.showError(errorMsg);
			new Notice(`분석 오류: ${errorMsg}`);
		}

		// 버튼 복원
		if (analyzeBtn) {
			analyzeBtn.disabled = false;
			analyzeBtn.textContent = '🚀 분석 시작';
		}
	}

	private showProgress(): void {
		if (this.progressContainer) {
			this.progressContainer.removeClass('hidden');
			this.progressContainer.empty();

			const bar = this.progressContainer.createDiv({ cls: 'progress-bar' });
			bar.createDiv({ cls: 'progress-fill' });
			this.progressContainer.createDiv({ cls: 'progress-text', text: '시작 중...' });
		}

		if (this.resultContainer) {
			this.resultContainer.addClass('hidden');
		}
	}

	private updateProgress(progress: AnalysisProgress): void {
		if (!this.progressContainer) return;

		const fill = this.progressContainer.querySelector('.progress-fill') as HTMLElement;
		const text = this.progressContainer.querySelector('.progress-text') as HTMLElement;

		if (fill) {
			fill.style.width = `${progress.progress}%`;
		}
		if (text) {
			text.textContent = progress.message;
		}
	}

	private showResult(content: string): void {
		if (this.progressContainer) {
			this.progressContainer.addClass('hidden');
		}

		if (this.resultContainer) {
			this.resultContainer.removeClass('hidden');
			this.resultContainer.empty();

			// 결과 헤더
			const header = this.resultContainer.createDiv({ cls: 'result-header' });
			header.createEl('h3', { text: '📊 분석 결과' });

			// 저장 버튼
			const saveBtn = header.createEl('button', {
				cls: 'result-save-btn',
				text: '📝 노트로 저장',
			});
			saveBtn.addEventListener('click', () => this.saveAsNote(content));

			// 결과 내용 (마크다운 렌더링)
			const contentDiv = this.resultContainer.createDiv({ cls: 'result-content' });
			MarkdownRenderer.render(
				this.app,
				content,
				contentDiv,
				'',
				this.renderComponent
			);
		}
	}

	private showError(message: string): void {
		if (this.progressContainer) {
			this.progressContainer.addClass('hidden');
		}

		if (this.resultContainer) {
			this.resultContainer.removeClass('hidden');
			this.resultContainer.empty();

			const errorDiv = this.resultContainer.createDiv({ cls: 'result-error' });
			errorDiv.createEl('h3', { text: '❌ 오류 발생' });
			errorDiv.createEl('p', { text: message });
		}
	}

	private async saveAsNote(content: string): Promise<void> {
		const date = TemplateEngine.getCurrentDateString();
		const categoryName = TemplateEngine.getCategoryName(this.selectedCategory);
		const templateName = this.selectedTemplate?.name || 'analysis';

		// 파일명 생성
		let fileName = this.settings.reportNaming
			.replace('{{category}}', this.selectedCategory)
			.replace('{{date}}', date);
		fileName = `${fileName}.md`;

		// 경로 생성
		const folderPath = this.settings.reportSavePath;
		const filePath = `${folderPath}/${fileName}`;

		// 폴더 생성 (없는 경우)
		const folder = this.app.vault.getAbstractFileByPath(folderPath);
		if (!folder) {
			await this.app.vault.createFolder(folderPath);
		}

		// 노트 내용 생성
		const noteContent = `---
type: ai-analysis
category: ${this.selectedCategory}
template: ${this.selectedTemplate?.id || 'unknown'}
provider: ${this.selectedProvider}
date: ${date}
---

# ${categoryName} 분석 리포트

> 생성일시: ${new Date().toLocaleString('ko-KR')}
> 템플릿: ${templateName}

${content}
`;

		try {
			// 파일이 이미 존재하는지 확인
			const existingFile = this.app.vault.getAbstractFileByPath(filePath);
			if (existingFile) {
				// 파일명에 타임스탬프 추가
				const timestamp = Date.now();
				const newFileName = fileName.replace('.md', `_${timestamp}.md`);
				await this.app.vault.create(`${folderPath}/${newFileName}`, noteContent);
				new Notice(`리포트가 저장되었습니다: ${newFileName}`);
			} else {
				await this.app.vault.create(filePath, noteContent);
				new Notice(`리포트가 저장되었습니다: ${fileName}`);
			}
		} catch (error) {
			new Notice(`저장 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
		}
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
		this.renderComponent.unload();
	}
}
