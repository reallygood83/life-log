import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import { LifeLogSettings, SubjectPreset, WorkoutTemplate, TimerStyle, AIAnalysisSettings, AIProviderType } from './types';
import type LifeLogPlugin from './main';

export const DEFAULT_SUBJECTS: SubjectPreset[] = [
	{ name: '수학', icon: '', color: '#4A90D9' },
	{ name: '영어', icon: '', color: '#7B68EE' },
	{ name: '프로그래밍', icon: '', color: '#50C878' },
	{ name: '독서', icon: '', color: '#FFB347' },
	{ name: '기타', icon: '', color: '#A0A0A0' },
];

export const DEFAULT_WORKOUT_TEMPLATES: WorkoutTemplate[] = [
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

export const DEFAULT_AI_SETTINGS: AIAnalysisSettings = {
	defaultProvider: 'openai',

	openaiApiKey: '',
	openaiModel: 'gpt-5',

	geminiApiKey: '',
	geminiModel: 'gemini-2.5-flash',

	grokApiKey: '',
	grokModel: 'grok-4-1-fast',

	openRouterApiKey: '',
	openRouterModel: 'anthropic/claude-sonnet-4',
	openRouterCustomModels: [],

	autoAnalysis: false,
	analysisSchedule: 'manual',

	enabledTemplates: [
		'study-weekly', 'study-monthly',
		'workout-weekly', 'workout-progress',
		'work-weekly', 'work-productivity',
		'meal-weekly', 'meal-pattern'
	],
	customTemplates: [],

	reportSavePath: 'Life Logs/Reports',
	reportNaming: '{{category}}_{{date}}_report',
};

export const DEFAULT_SETTINGS: LifeLogSettings = {
	logFolder: 'Life Logs',
	dateFormat: 'YYYY-MM-DD',

	subjects: DEFAULT_SUBJECTS,
	defaultStudyDuration: 30,
	enablePomodoro: false,
	pomodoroWork: 25,
	pomodoroBreak: 5,

	defaultRestDuration: 60,
	workoutTemplates: DEFAULT_WORKOUT_TEMPLATES,

	defaultTab: 'study',
	showRibbonIcon: true,

	enableTimerSound: true,
	enableNotifications: true,

	timerStyle: 'digital',
	usePerTypeTimerStyle: false,
	studyTimerStyle: 'pomodoro',
	workTimerStyle: 'digital',
	workoutTimerStyle: 'digital',

	aiAnalysis: DEFAULT_AI_SETTINGS,
};

export class LifeLogSettingTab extends PluginSettingTab {
	plugin: LifeLogPlugin;

	constructor(app: App, plugin: LifeLogPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		console.log('[Life Log] LifeLogSettingTab constructed');
	}

	display(): void {
		console.log('[Life Log] LifeLogSettingTab.display() called');
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Life Log 설정' });

		if (!this.plugin.settings) {
			containerEl.createEl('p', { text: '설정을 불러오는 중 오류가 발생했습니다.' });
			return;
		}

		// Ensure aiAnalysis settings exist
		if (!this.plugin.settings.aiAnalysis) {
			this.plugin.settings.aiAnalysis = { ...DEFAULT_AI_SETTINGS };
		}

		this.renderSaveSettings(containerEl);
		this.renderStudySettings(containerEl);
		this.renderWorkoutSettings(containerEl);
		this.renderTimerStyleSettings(containerEl);
		this.renderUISettings(containerEl);
		this.renderNotificationSettings(containerEl);
		this.renderAISettings(containerEl);
	}

	private renderSaveSettings(containerEl: HTMLElement): void {
		containerEl.createEl('h3', { text: '📁 저장 설정' });

		new Setting(containerEl)
			.setName('기록 저장 폴더')
			.setDesc('학습/운동 기록이 저장될 폴더 경로')
			.addText(text => text
				.setPlaceholder('Life Logs')
				.setValue(this.plugin.settings.logFolder)
				.onChange(async (value) => {
					this.plugin.settings.logFolder = value || 'Life Logs';
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('날짜 형식')
			.setDesc('파일명에 사용될 날짜 형식')
			.addDropdown(dropdown => dropdown
				.addOption('YYYY-MM-DD', 'YYYY-MM-DD')
				.addOption('YYYY/MM/DD', 'YYYY/MM/DD')
				.addOption('DD-MM-YYYY', 'DD-MM-YYYY')
				.setValue(this.plugin.settings.dateFormat)
				.onChange(async (value) => {
					this.plugin.settings.dateFormat = value;
					await this.plugin.saveSettings();
				}));
	}

	private renderStudySettings(containerEl: HTMLElement): void {
		containerEl.createEl('h3', { text: '📚 학습 기록 설정' });

		new Setting(containerEl)
			.setName('기본 목표 시간')
			.setDesc('학습 항목의 기본 목표 시간 (분)')
			.addText(text => text
				.setPlaceholder('30')
				.setValue(String(this.plugin.settings.defaultStudyDuration))
				.onChange(async (value) => {
					const num = parseInt(value) || 30;
					this.plugin.settings.defaultStudyDuration = Math.max(1, Math.min(480, num));
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('포모도로 모드')
			.setDesc('25분 학습 + 5분 휴식 사이클 활성화')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enablePomodoro)
				.onChange(async (value) => {
					this.plugin.settings.enablePomodoro = value;
					await this.plugin.saveSettings();
				}));

		if (this.plugin.settings.enablePomodoro) {
			new Setting(containerEl)
				.setName('작업 시간')
				.setDesc('포모도로 작업 시간 (분)')
				.addText(text => text
					.setPlaceholder('25')
					.setValue(String(this.plugin.settings.pomodoroWork))
					.onChange(async (value) => {
						const num = parseInt(value) || 25;
						this.plugin.settings.pomodoroWork = Math.max(1, Math.min(60, num));
						await this.plugin.saveSettings();
					}));

			new Setting(containerEl)
				.setName('휴식 시간')
				.setDesc('포모도로 휴식 시간 (분)')
				.addText(text => text
					.setPlaceholder('5')
					.setValue(String(this.plugin.settings.pomodoroBreak))
					.onChange(async (value) => {
						const num = parseInt(value) || 5;
						this.plugin.settings.pomodoroBreak = Math.max(1, Math.min(30, num));
						await this.plugin.saveSettings();
					}));
		}

		this.renderSubjectManager(containerEl);
	}

	private renderSubjectManager(containerEl: HTMLElement): void {
		const subjectContainer = containerEl.createDiv({ cls: 'subject-manager' });
		
		new Setting(subjectContainer)
			.setName('과목 관리')
			.setDesc('자주 사용하는 과목을 관리합니다')
			.addButton(button => button
				.setButtonText('+ 과목 추가')
				.onClick(async () => {
					this.plugin.settings.subjects.push({
						name: '새 과목',
						icon: '📚',
						color: '#808080'
					});
					await this.plugin.saveSettings();
					this.display();
				}));

		const subjectList = subjectContainer.createDiv({ cls: 'subject-list' });
		
		for (let i = 0; i < this.plugin.settings.subjects.length; i++) {
			const subject = this.plugin.settings.subjects[i];
			if (!subject) continue;

			const subjectRow = subjectList.createDiv({ cls: 'subject-row' });
			
			const iconInput = subjectRow.createEl('input', {
				type: 'text',
				value: subject.icon,
				cls: 'subject-icon-input'
			});
			iconInput.maxLength = 2;
			iconInput.addEventListener('change', async () => {
				subject.icon = iconInput.value || '📚';
				await this.plugin.saveSettings();
			});

			const nameInput = subjectRow.createEl('input', {
				type: 'text',
				value: subject.name,
				cls: 'subject-name-input'
			});
			nameInput.addEventListener('change', async () => {
				subject.name = nameInput.value || '과목';
				await this.plugin.saveSettings();
			});

			const colorInput = subjectRow.createEl('input', {
				type: 'color',
				value: subject.color,
				cls: 'subject-color-input'
			});
			colorInput.addEventListener('change', async () => {
				subject.color = colorInput.value;
				await this.plugin.saveSettings();
			});

			const deleteBtn = subjectRow.createEl('button', {
				text: '🗑',
				cls: 'subject-delete-btn'
			});
			deleteBtn.addEventListener('click', async () => {
				this.plugin.settings.subjects.splice(i, 1);
				await this.plugin.saveSettings();
				this.display();
			});
		}
	}

	private renderWorkoutSettings(containerEl: HTMLElement): void {
		containerEl.createEl('h3', { text: '운동 기록 설정' });

		new Setting(containerEl)
			.setName('기본 휴식 시간')
			.setDesc('운동 세트 사이 기본 휴식 시간 (초)')
			.addText(text => text
				.setPlaceholder('60')
				.setValue(String(this.plugin.settings.defaultRestDuration))
				.onChange(async (value) => {
					const num = parseInt(value) || 60;
					this.plugin.settings.defaultRestDuration = Math.max(10, Math.min(300, num));
					await this.plugin.saveSettings();
				}));

		this.renderWorkoutTemplateManager(containerEl);
	}

	private renderWorkoutTemplateManager(containerEl: HTMLElement): void {
		const templateContainer = containerEl.createDiv({ cls: 'template-manager' });
		
		new Setting(templateContainer)
			.setName('운동 템플릿 관리')
			.setDesc('빠른 템플릿에 표시되는 운동 세트를 관리합니다')
			.addButton(button => button
				.setButtonText('+ 템플릿 추가')
				.onClick(async () => {
					this.plugin.settings.workoutTemplates.push({
						name: '새 템플릿',
						exercises: [{ name: '운동명', params: '횟수: [10]' }]
					});
					await this.plugin.saveSettings();
					this.display();
				}));

		const templateList = templateContainer.createDiv({ cls: 'template-list' });
		
		if (!this.plugin.settings.workoutTemplates) {
			this.plugin.settings.workoutTemplates = [...DEFAULT_WORKOUT_TEMPLATES];
		}

		for (let i = 0; i < this.plugin.settings.workoutTemplates.length; i++) {
			const template = this.plugin.settings.workoutTemplates[i];
			if (!template) continue;

			const templateItem = templateList.createDiv({ cls: 'template-item' });
			
			const headerRow = templateItem.createDiv({ cls: 'template-header-row' });
			
			const nameInput = headerRow.createEl('input', {
				type: 'text',
				value: template.name,
				cls: 'template-name-input'
			});
			nameInput.addEventListener('change', async () => {
				template.name = nameInput.value || '템플릿';
				await this.plugin.saveSettings();
			});

			const deleteBtn = headerRow.createEl('button', {
				text: '삭제',
				cls: 'template-delete-btn'
			});
			deleteBtn.addEventListener('click', async () => {
				this.plugin.settings.workoutTemplates.splice(i, 1);
				await this.plugin.saveSettings();
				this.display();
			});

			const exerciseList = templateItem.createDiv({ cls: 'template-exercise-list' });
			
			for (let j = 0; j < template.exercises.length; j++) {
				const exercise = template.exercises[j];
				if (!exercise) continue;

				const exerciseRow = exerciseList.createDiv({ cls: 'template-exercise-row' });
				
				const exNameInput = exerciseRow.createEl('input', {
					type: 'text',
					value: exercise.name,
					placeholder: '운동명',
					cls: 'template-exercise-name'
				});
				exNameInput.addEventListener('change', async () => {
					exercise.name = exNameInput.value || '운동';
					await this.plugin.saveSettings();
				});

				const exParamsInput = exerciseRow.createEl('input', {
					type: 'text',
					value: exercise.params,
					placeholder: '무게: [60]kg | 횟수: [10]',
					cls: 'template-exercise-params'
				});
				exParamsInput.addEventListener('change', async () => {
					exercise.params = exParamsInput.value || '';
					await this.plugin.saveSettings();
				});

				const exDeleteBtn = exerciseRow.createEl('button', {
					text: '×',
					cls: 'template-exercise-delete'
				});
				exDeleteBtn.addEventListener('click', async () => {
					template.exercises.splice(j, 1);
					await this.plugin.saveSettings();
					this.display();
				});
			}

			const addExerciseBtn = templateItem.createEl('button', {
				text: '+ 운동 추가',
				cls: 'template-add-exercise'
			});
			addExerciseBtn.addEventListener('click', async () => {
				template.exercises.push({ name: '운동명', params: '횟수: [10]' });
				await this.plugin.saveSettings();
				this.display();
			});
		}
	}

	private renderTimerStyleSettings(containerEl: HTMLElement): void {
		containerEl.createEl('h3', { text: '타이머 스타일' });

		const timerStyleOptions: { value: TimerStyle; label: string }[] = [
			{ value: 'digital', label: '디지털 (00:00:00)' },
			{ value: 'pomodoro', label: '뽀모도로 (25/5 사이클)' },
			{ value: 'analog', label: '아날로그 (원형 시계)' },
		];

		new Setting(containerEl)
			.setName('공통 타이머 스타일')
			.setDesc('모든 기록 유형에 적용되는 기본 타이머 스타일')
			.addDropdown(dropdown => {
				for (const opt of timerStyleOptions) {
					dropdown.addOption(opt.value, opt.label);
				}
				dropdown
					.setValue(this.plugin.settings.timerStyle)
					.onChange(async (value: TimerStyle) => {
						this.plugin.settings.timerStyle = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName('유형별 개별 설정')
			.setDesc('학습/업무/운동 기록마다 다른 타이머 스타일 사용')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.usePerTypeTimerStyle)
				.onChange(async (value) => {
					this.plugin.settings.usePerTypeTimerStyle = value;
					await this.plugin.saveSettings();
					this.display();
				}));

		if (this.plugin.settings.usePerTypeTimerStyle) {
			new Setting(containerEl)
				.setName('학습 기록 타이머')
				.setDesc('학습 기록에 사용할 타이머 스타일')
				.addDropdown(dropdown => {
					for (const opt of timerStyleOptions) {
						dropdown.addOption(opt.value, opt.label);
					}
					dropdown
						.setValue(this.plugin.settings.studyTimerStyle)
						.onChange(async (value: TimerStyle) => {
							this.plugin.settings.studyTimerStyle = value;
							await this.plugin.saveSettings();
						});
				});

			new Setting(containerEl)
				.setName('업무 기록 타이머')
				.setDesc('업무 기록에 사용할 타이머 스타일')
				.addDropdown(dropdown => {
					for (const opt of timerStyleOptions) {
						dropdown.addOption(opt.value, opt.label);
					}
					dropdown
						.setValue(this.plugin.settings.workTimerStyle)
						.onChange(async (value: TimerStyle) => {
							this.plugin.settings.workTimerStyle = value;
							await this.plugin.saveSettings();
						});
				});

			new Setting(containerEl)
				.setName('운동 기록 타이머')
				.setDesc('운동 기록에 사용할 타이머 스타일')
				.addDropdown(dropdown => {
					for (const opt of timerStyleOptions) {
						dropdown.addOption(opt.value, opt.label);
					}
					dropdown
						.setValue(this.plugin.settings.workoutTimerStyle)
						.onChange(async (value: TimerStyle) => {
							this.plugin.settings.workoutTimerStyle = value;
							await this.plugin.saveSettings();
						});
				});
		}
	}

	private renderUISettings(containerEl: HTMLElement): void {
		containerEl.createEl('h3', { text: 'UI 설정' });

		new Setting(containerEl)
			.setName('기본 탭')
			.setDesc('새 기록 모달을 열 때 기본으로 선택되는 탭')
			.addDropdown(dropdown => dropdown
				.addOption('study', '학습 기록')
				.addOption('workout', '운동 기록')
				.setValue(this.plugin.settings.defaultTab)
				.onChange(async (value: 'study' | 'workout') => {
					this.plugin.settings.defaultTab = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('리본 아이콘')
			.setDesc('왼쪽 사이드바에 빠른 접근 아이콘 표시')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showRibbonIcon)
				.onChange(async (value) => {
					this.plugin.settings.showRibbonIcon = value;
					await this.plugin.saveSettings();
					this.plugin.updateRibbonIcon();
				}));
	}

	private renderNotificationSettings(containerEl: HTMLElement): void {
		containerEl.createEl('h3', { text: '🔔 알림 설정' });

		new Setting(containerEl)
			.setName('타이머 완료음')
			.setDesc('카운트다운 완료 시 알림음 재생')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableTimerSound)
				.onChange(async (value) => {
					this.plugin.settings.enableTimerSound = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('시스템 알림')
			.setDesc('타이머 완료 시 시스템 알림 표시')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableNotifications)
				.onChange(async (value) => {
					this.plugin.settings.enableNotifications = value;
					await this.plugin.saveSettings();
				}));
	}

	private renderAISettings(containerEl: HTMLElement): void {
		containerEl.createEl('h3', { text: '🤖 AI 분석 설정' });

		const aiSettings = this.plugin.settings.aiAnalysis;

		// Provider Selection
		new Setting(containerEl)
			.setName('AI Provider')
			.setDesc('분석에 사용할 AI 서비스를 선택합니다')
			.addDropdown(dropdown => dropdown
				.addOption('openai', 'OpenAI (GPT-4)')
				.addOption('gemini', 'Google Gemini')
				.addOption('grok', 'xAI Grok')
				.addOption('openrouter', 'OpenRouter')
				.setValue(aiSettings.defaultProvider)
				.onChange(async (value: AIProviderType) => {
					aiSettings.defaultProvider = value;
					await this.plugin.saveSettings();
					this.display();
				}));

		// OpenAI Settings
		this.renderOpenAISettings(containerEl, aiSettings);

		// Gemini Settings
		this.renderGeminiSettings(containerEl, aiSettings);

		// Grok Settings
		this.renderGrokSettings(containerEl, aiSettings);

		// OpenRouter Settings
		this.renderOpenRouterSettings(containerEl, aiSettings);

		// Report Settings
		this.renderReportSettings(containerEl, aiSettings);
	}

	private renderOpenAISettings(containerEl: HTMLElement, aiSettings: AIAnalysisSettings): void {
		const isActive = aiSettings.defaultProvider === 'openai';
		const sectionEl = containerEl.createDiv({ cls: `ai-provider-section ${isActive ? 'active' : 'collapsed'}` });

		new Setting(sectionEl)
			.setName('▶ OpenAI 설정')
			.setDesc(isActive ? '현재 사용 중' : '클릭하여 확장')
			.setClass('ai-provider-header')
			.addButton(button => button
				.setButtonText('연결 테스트')
				.setDisabled(!aiSettings.openaiApiKey)
				.onClick(async () => {
					await this.testOpenAIConnection(aiSettings);
				}));

		if (isActive || aiSettings.openaiApiKey) {
			new Setting(sectionEl)
				.setName('API Key')
				.setDesc('OpenAI API 키')
				.addText(text => text
					.setPlaceholder('sk-...')
					.setValue(aiSettings.openaiApiKey ? '••••••••' : '')
					.onChange(async (value) => {
						if (value && !value.startsWith('••')) {
							aiSettings.openaiApiKey = value;
							await this.plugin.saveSettings();
							this.display(); // 버튼 상태 갱신
						}
					}));

			// 2026년 최신 모델 목록
			const openaiModels = [
				{ value: 'gpt-5.2', label: 'GPT-5.2 (최신)' },
				{ value: 'gpt-5', label: 'GPT-5 (추천)' },
				{ value: 'o4-mini', label: 'o4-mini (추론 최적화)' },
				{ value: 'o3', label: 'o3 (추론 모델)' },
				{ value: 'gpt-4o', label: 'GPT-4o' },
				{ value: 'gpt-4o-mini', label: 'GPT-4o Mini (빠름)' },
				{ value: 'custom', label: '직접 입력...' },
			];

			const isCustomModel = !openaiModels.some(m => m.value === aiSettings.openaiModel && m.value !== 'custom');

			new Setting(sectionEl)
				.setName('모델')
				.setDesc('사용할 OpenAI 모델')
				.addDropdown(dropdown => {
					for (const model of openaiModels) {
						dropdown.addOption(model.value, model.label);
					}
					dropdown
						.setValue(isCustomModel ? 'custom' : aiSettings.openaiModel)
						.onChange(async (value) => {
							if (value === 'custom') {
								this.display();
							} else {
								aiSettings.openaiModel = value;
								await this.plugin.saveSettings();
								this.display();
							}
						});
				});

			// 커스텀 모델 입력
			if (isCustomModel || aiSettings.openaiModel === 'custom') {
				new Setting(sectionEl)
					.setName('커스텀 모델명')
					.setDesc('OpenAI 모델 ID를 직접 입력')
					.addText(text => text
						.setPlaceholder('gpt-5-turbo')
						.setValue(isCustomModel ? aiSettings.openaiModel : '')
						.onChange(async (value) => {
							if (value) {
								aiSettings.openaiModel = value;
								await this.plugin.saveSettings();
							}
						}));
			}
		}
	}

	private renderGeminiSettings(containerEl: HTMLElement, aiSettings: AIAnalysisSettings): void {
		const isActive = aiSettings.defaultProvider === 'gemini';
		const sectionEl = containerEl.createDiv({ cls: `ai-provider-section ${isActive ? 'active' : 'collapsed'}` });

		new Setting(sectionEl)
			.setName('▶ Google Gemini 설정')
			.setDesc(isActive ? '현재 사용 중' : '클릭하여 확장')
			.setClass('ai-provider-header')
			.addButton(button => button
				.setButtonText('연결 테스트')
				.setDisabled(!aiSettings.geminiApiKey)
				.onClick(async () => {
					await this.testGeminiConnection(aiSettings);
				}));

		if (isActive || aiSettings.geminiApiKey) {
			new Setting(sectionEl)
				.setName('API Key')
				.setDesc('Google AI Studio API 키')
				.addText(text => text
					.setPlaceholder('AIza...')
					.setValue(aiSettings.geminiApiKey ? '••••••••' : '')
					.onChange(async (value) => {
						if (value && !value.startsWith('••')) {
							aiSettings.geminiApiKey = value;
							await this.plugin.saveSettings();
							this.display(); // 버튼 상태 갱신
						}
					}));

			// 2026년 최신 모델 목록
			const geminiModels = [
				{ value: 'gemini-3-pro-preview', label: 'Gemini 3 Pro (최신)' },
				{ value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash (빠름)' },
				{ value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (추천)' },
				{ value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
				{ value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite (경량)' },
				{ value: 'custom', label: '직접 입력...' },
			];

			const isCustomModel = !geminiModels.some(m => m.value === aiSettings.geminiModel && m.value !== 'custom');

			new Setting(sectionEl)
				.setName('모델')
				.setDesc('사용할 Gemini 모델')
				.addDropdown(dropdown => {
					for (const model of geminiModels) {
						dropdown.addOption(model.value, model.label);
					}
					dropdown
						.setValue(isCustomModel ? 'custom' : aiSettings.geminiModel)
						.onChange(async (value) => {
							if (value === 'custom') {
								this.display();
							} else {
								aiSettings.geminiModel = value;
								await this.plugin.saveSettings();
								this.display();
							}
						});
				});

			// 커스텀 모델 입력
			if (isCustomModel || aiSettings.geminiModel === 'custom') {
				new Setting(sectionEl)
					.setName('커스텀 모델명')
					.setDesc('Gemini 모델 ID를 직접 입력')
					.addText(text => text
						.setPlaceholder('gemini-3-ultra')
						.setValue(isCustomModel ? aiSettings.geminiModel : '')
						.onChange(async (value) => {
							if (value) {
								aiSettings.geminiModel = value;
								await this.plugin.saveSettings();
							}
						}));
			}
		}
	}

	private renderGrokSettings(containerEl: HTMLElement, aiSettings: AIAnalysisSettings): void {
		const isActive = aiSettings.defaultProvider === 'grok';
		const sectionEl = containerEl.createDiv({ cls: `ai-provider-section ${isActive ? 'active' : 'collapsed'}` });

		new Setting(sectionEl)
			.setName('▶ xAI Grok 설정')
			.setDesc(isActive ? '현재 사용 중' : '클릭하여 확장')
			.setClass('ai-provider-header')
			.addButton(button => button
				.setButtonText('연결 테스트')
				.setDisabled(!aiSettings.grokApiKey)
				.onClick(async () => {
					await this.testGrokConnection(aiSettings);
				}));

		if (isActive || aiSettings.grokApiKey) {
			new Setting(sectionEl)
				.setName('API Key')
				.setDesc('xAI API 키')
				.addText(text => text
					.setPlaceholder('xai-...')
					.setValue(aiSettings.grokApiKey ? '••••••••' : '')
					.onChange(async (value) => {
						if (value && !value.startsWith('••')) {
							aiSettings.grokApiKey = value;
							await this.plugin.saveSettings();
							this.display(); // 버튼 상태 갱신
						}
					}));

			// 2026년 최신 모델 목록
			const grokModels = [
				{ value: 'grok-4-1-fast', label: 'Grok 4.1 Fast (최신/빠름)' },
				{ value: 'grok-4-heavy', label: 'Grok 4 Heavy (고성능)' },
				{ value: 'grok-4', label: 'Grok 4 (추천)' },
				{ value: 'grok-3', label: 'Grok 3' },
				{ value: 'grok-3-mini', label: 'Grok 3 Mini (경량)' },
				{ value: 'custom', label: '직접 입력...' },
			];

			const isCustomModel = !grokModels.some(m => m.value === aiSettings.grokModel && m.value !== 'custom');

			new Setting(sectionEl)
				.setName('모델')
				.setDesc('사용할 Grok 모델')
				.addDropdown(dropdown => {
					for (const model of grokModels) {
						dropdown.addOption(model.value, model.label);
					}
					dropdown
						.setValue(isCustomModel ? 'custom' : aiSettings.grokModel)
						.onChange(async (value) => {
							if (value === 'custom') {
								this.display();
							} else {
								aiSettings.grokModel = value;
								await this.plugin.saveSettings();
								this.display();
							}
						});
				});

			// 커스텀 모델 입력
			if (isCustomModel || aiSettings.grokModel === 'custom') {
				new Setting(sectionEl)
					.setName('커스텀 모델명')
					.setDesc('Grok 모델 ID를 직접 입력')
					.addText(text => text
						.setPlaceholder('grok-5-preview')
						.setValue(isCustomModel ? aiSettings.grokModel : '')
						.onChange(async (value) => {
							if (value) {
								aiSettings.grokModel = value;
								await this.plugin.saveSettings();
							}
						}));
			}
		}
	}

	private renderOpenRouterSettings(containerEl: HTMLElement, aiSettings: AIAnalysisSettings): void {
		const isActive = aiSettings.defaultProvider === 'openrouter';
		const sectionEl = containerEl.createDiv({ cls: `ai-provider-section ${isActive ? 'active' : 'collapsed'}` });

		new Setting(sectionEl)
			.setName('▶ OpenRouter 설정')
			.setDesc(isActive ? '현재 사용 중 - 다양한 모델 선택 가능' : '클릭하여 확장')
			.setClass('ai-provider-header')
			.addButton(button => button
				.setButtonText('연결 테스트')
				.setDisabled(!aiSettings.openRouterApiKey)
				.onClick(async () => {
					await this.testOpenRouterConnection(aiSettings);
				}));

		if (isActive || aiSettings.openRouterApiKey) {
			new Setting(sectionEl)
				.setName('API Key')
				.setDesc('OpenRouter API 키')
				.addText(text => text
					.setPlaceholder('sk-or-...')
					.setValue(aiSettings.openRouterApiKey ? '••••••••' : '')
					.onChange(async (value) => {
						if (value && !value.startsWith('••')) {
							aiSettings.openRouterApiKey = value;
							await this.plugin.saveSettings();
							this.display(); // 버튼 상태 갱신
						}
					}));

			new Setting(sectionEl)
				.setName('기본 모델')
				.setDesc('사용할 OpenRouter 모델 ID (예: anthropic/claude-sonnet-4)')
				.addText(text => text
					.setPlaceholder('anthropic/claude-sonnet-4')
					.setValue(aiSettings.openRouterModel)
					.onChange(async (value) => {
						aiSettings.openRouterModel = value || 'anthropic/claude-sonnet-4';
						await this.plugin.saveSettings();
					}));

			// Custom models management
			const customModelsEl = sectionEl.createDiv({ cls: 'custom-models-section' });

			new Setting(customModelsEl)
				.setName('추가 모델 관리')
				.setDesc('자주 사용하는 모델을 추가합니다')
				.addButton(button => button
					.setButtonText('+ 모델 추가')
					.onClick(async () => {
						aiSettings.openRouterCustomModels.push('');
						await this.plugin.saveSettings();
						this.display();
					}));

			// 2026년 추천 모델 목록
			const suggestedModels = [
				'anthropic/claude-sonnet-4',
				'anthropic/claude-opus-4',
				'openai/gpt-5',
				'openai/o3',
				'google/gemini-2.5-pro',
				'google/gemini-3-flash-preview',
				'meta-llama/llama-4-maverick',
				'deepseek/deepseek-r1',
				'mistralai/mistral-large-2',
			];

			const modelListEl = customModelsEl.createDiv({ cls: 'model-list' });

			for (let i = 0; i < aiSettings.openRouterCustomModels.length; i++) {
				const modelRow = modelListEl.createDiv({ cls: 'model-row' });

				const modelInput = modelRow.createEl('input', {
					type: 'text',
					value: aiSettings.openRouterCustomModels[i],
					placeholder: 'model/name',
					cls: 'model-input'
				});
				modelInput.addEventListener('change', async () => {
					aiSettings.openRouterCustomModels[i] = modelInput.value;
					await this.plugin.saveSettings();
				});

				const deleteBtn = modelRow.createEl('button', {
					text: '×',
					cls: 'model-delete-btn'
				});
				deleteBtn.addEventListener('click', async () => {
					aiSettings.openRouterCustomModels.splice(i, 1);
					await this.plugin.saveSettings();
					this.display();
				});
			}

			// Suggested models dropdown
			new Setting(customModelsEl)
				.setName('추천 모델')
				.setDesc('자주 사용되는 모델 목록')
				.addDropdown(dropdown => {
					dropdown.addOption('', '-- 선택하여 추가 --');
					for (const model of suggestedModels) {
						if (!aiSettings.openRouterCustomModels.includes(model)) {
							dropdown.addOption(model, model);
						}
					}
					dropdown.onChange(async (value) => {
						if (value) {
							aiSettings.openRouterCustomModels.push(value);
							await this.plugin.saveSettings();
							this.display();
						}
					});
				});
		}
	}

	private renderReportSettings(containerEl: HTMLElement, aiSettings: AIAnalysisSettings): void {
		containerEl.createEl('h4', { text: '📊 리포트 설정' });

		new Setting(containerEl)
			.setName('저장 경로')
			.setDesc('AI 분석 리포트가 저장될 폴더 경로')
			.addText(text => text
				.setPlaceholder('Life Logs/Reports')
				.setValue(aiSettings.reportSavePath)
				.onChange(async (value) => {
					aiSettings.reportSavePath = value || 'Life Logs/Reports';
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('파일명 형식')
			.setDesc('리포트 파일명 형식 ({{category}}, {{date}} 사용 가능)')
			.addText(text => text
				.setPlaceholder('{{category}}_{{date}}_report')
				.setValue(aiSettings.reportNaming)
				.onChange(async (value) => {
					aiSettings.reportNaming = value || '{{category}}_{{date}}_report';
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('자동 분석')
			.setDesc('자동 분석 일정 설정')
			.addDropdown(dropdown => dropdown
				.addOption('manual', '수동 실행만')
				.addOption('daily', '매일')
				.addOption('weekly', '매주')
				.setValue(aiSettings.analysisSchedule)
				.onChange(async (value: 'manual' | 'daily' | 'weekly') => {
					aiSettings.analysisSchedule = value;
					aiSettings.autoAnalysis = value !== 'manual';
					await this.plugin.saveSettings();
				}));
	}

	// Connection test methods
	private async testOpenAIConnection(aiSettings: AIAnalysisSettings): Promise<void> {
		new Notice('OpenAI 연결 테스트 중...');
		try {
			const response = await fetch('https://api.openai.com/v1/models', {
				headers: {
					'Authorization': `Bearer ${aiSettings.openaiApiKey}`
				}
			});
			if (response.ok) {
				new Notice('✅ OpenAI 연결 성공!');
			} else {
				const error = await response.json();
				new Notice(`❌ OpenAI 연결 실패: ${error.error?.message || response.statusText}`);
			}
		} catch (e) {
			new Notice(`❌ OpenAI 연결 실패: ${e instanceof Error ? e.message : '알 수 없는 오류'}`);
		}
	}

	private async testGeminiConnection(aiSettings: AIAnalysisSettings): Promise<void> {
		new Notice('Gemini 연결 테스트 중...');
		try {
			const response = await fetch(
				`https://generativelanguage.googleapis.com/v1beta/models?key=${aiSettings.geminiApiKey}`
			);
			if (response.ok) {
				new Notice('✅ Gemini 연결 성공!');
			} else {
				const error = await response.json();
				new Notice(`❌ Gemini 연결 실패: ${error.error?.message || response.statusText}`);
			}
		} catch (e) {
			new Notice(`❌ Gemini 연결 실패: ${e instanceof Error ? e.message : '알 수 없는 오류'}`);
		}
	}

	private async testGrokConnection(aiSettings: AIAnalysisSettings): Promise<void> {
		new Notice('Grok 연결 테스트 중...');
		try {
			const response = await fetch('https://api.x.ai/v1/models', {
				headers: {
					'Authorization': `Bearer ${aiSettings.grokApiKey}`
				}
			});
			if (response.ok) {
				new Notice('✅ Grok 연결 성공!');
			} else {
				const error = await response.json();
				new Notice(`❌ Grok 연결 실패: ${error.error?.message || response.statusText}`);
			}
		} catch (e) {
			new Notice(`❌ Grok 연결 실패: ${e instanceof Error ? e.message : '알 수 없는 오류'}`);
		}
	}

	private async testOpenRouterConnection(aiSettings: AIAnalysisSettings): Promise<void> {
		new Notice('OpenRouter 연결 테스트 중...');
		try {
			const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
				headers: {
					'Authorization': `Bearer ${aiSettings.openRouterApiKey}`
				}
			});
			if (response.ok) {
				const data = await response.json();
				new Notice(`✅ OpenRouter 연결 성공! (크레딧: $${data.data?.limit_remaining?.toFixed(2) || 'N/A'})`);
			} else {
				const error = await response.json();
				new Notice(`❌ OpenRouter 연결 실패: ${error.error?.message || response.statusText}`);
			}
		} catch (e) {
			new Notice(`❌ OpenRouter 연결 실패: ${e instanceof Error ? e.message : '알 수 없는 오류'}`);
		}
	}
}
