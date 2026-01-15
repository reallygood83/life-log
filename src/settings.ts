import { App, PluginSettingTab, Setting } from 'obsidian';
import { LifeLogSettings, SubjectPreset, WorkoutTemplate, TimerStyle } from './types';
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

		this.renderSaveSettings(containerEl);
		this.renderStudySettings(containerEl);
		this.renderWorkoutSettings(containerEl);
		this.renderTimerStyleSettings(containerEl);
		this.renderUISettings(containerEl);
		this.renderNotificationSettings(containerEl);
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
}
