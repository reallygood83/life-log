import { App, Modal, TFile } from 'obsidian';
import { LifeLogSettings } from '../types';
import { FileCreator } from '../file/creator';
import { StudyLogTab } from './StudyLogTab';
import { WorkLogTab } from './WorkLogTab';
import { WorkoutLogTab } from './WorkoutLogTab';
import { MealLogTab } from './MealLogTab';

export class QuickLogModal extends Modal {
	private settings: LifeLogSettings;
	private fileCreator: FileCreator;
	private activeTab: 'study' | 'work' | 'workout' | 'meal';
	private tabContentEl: HTMLElement | null = null;

	constructor(app: App, settings: LifeLogSettings, fileCreator: FileCreator) {
		super(app);
		this.settings = settings;
		this.fileCreator = fileCreator;
		this.activeTab = settings.defaultTab;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('quick-log-modal');

		this.renderHeader(contentEl);
		this.renderTabs(contentEl);
		this.renderTabContent(contentEl);
	}

	private renderHeader(container: HTMLElement): void {
		const headerEl = container.createDiv({ cls: 'modal-header' });
		headerEl.createEl('h2', { text: 'Life Log' });
	}

	private renderTabs(container: HTMLElement): void {
		const tabsEl = container.createDiv({ cls: 'modal-tabs' });

		const studyTab = tabsEl.createEl('button', {
			cls: `modal-tab ${this.activeTab === 'study' ? 'active' : ''}`,
			text: '학습 기록'
		});
		studyTab.addEventListener('click', () => {
			this.activeTab = 'study';
			this.updateActiveTab(tabsEl);
			this.renderTabContent(container);
		});

		const workTab = tabsEl.createEl('button', {
			cls: `modal-tab ${this.activeTab === 'work' ? 'active' : ''}`,
			text: '업무 기록'
		});
		workTab.addEventListener('click', () => {
			this.activeTab = 'work';
			this.updateActiveTab(tabsEl);
			this.renderTabContent(container);
		});

		const workoutTab = tabsEl.createEl('button', {
			cls: `modal-tab ${this.activeTab === 'workout' ? 'active' : ''}`,
			text: '운동 기록'
		});
		workoutTab.addEventListener('click', () => {
			this.activeTab = 'workout';
			this.updateActiveTab(tabsEl);
			this.renderTabContent(container);
		});

		const mealTab = tabsEl.createEl('button', {
			cls: `modal-tab ${this.activeTab === 'meal' ? 'active' : ''}`,
			text: '식단 기록'
		});
		mealTab.addEventListener('click', () => {
			this.activeTab = 'meal';
			this.updateActiveTab(tabsEl);
			this.renderTabContent(container);
		});
	}

	private updateActiveTab(tabsEl: HTMLElement): void {
		const tabs = ['study', 'work', 'workout', 'meal'];
		tabsEl.querySelectorAll('.modal-tab').forEach((tab, idx) => {
			if (tabs[idx] === this.activeTab) {
				tab.classList.add('active');
			} else {
				tab.classList.remove('active');
			}
		});
	}

	private renderTabContent(container: HTMLElement): void {
		if (this.tabContentEl) {
			this.tabContentEl.remove();
		}

		this.tabContentEl = container.createDiv({ cls: 'modal-tab-content' });

		const onCreated = (file: TFile) => {
			this.close();
			this.app.workspace.getLeaf().openFile(file);
		};

		if (this.activeTab === 'study') {
			const studyTab = new StudyLogTab(this.tabContentEl, {
				app: this.app,
				settings: this.settings,
				fileCreator: this.fileCreator,
				onCreated
			});
			studyTab.render();
		} else if (this.activeTab === 'work') {
			const workTab = new WorkLogTab(this.tabContentEl, {
				app: this.app,
				settings: this.settings,
				fileCreator: this.fileCreator,
				onCreated
			});
			workTab.render();
		} else if (this.activeTab === 'workout') {
			const workoutTab = new WorkoutLogTab(this.tabContentEl, {
				app: this.app,
				settings: this.settings,
				fileCreator: this.fileCreator,
				onCreated
			});
			workoutTab.render();
		} else if (this.activeTab === 'meal') {
			const mealTab = new MealLogTab(this.tabContentEl, {
				app: this.app,
				settings: this.settings,
				fileCreator: this.fileCreator,
				onCreated
			});
			mealTab.render();
		}
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}
