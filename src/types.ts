import { MarkdownPostProcessorContext, TFile, App } from 'obsidian';

// ============================================
// COMMON TYPES
// ============================================

// Shared states for both workout and study logs
export type LogState = 'planned' | 'started' | 'completed';

// ============================================
// WORKOUT LOG TYPES (existing)
// ============================================

// Workout states (alias for backward compatibility)
export type WorkoutState = LogState;

// Exercise completion states from markdown checkboxes
// [ ] = pending, [\] = inProgress, [x] = completed, [-] = skipped
export type ExerciseState = 'pending' | 'inProgress' | 'completed' | 'skipped';

// Key-value pairs for exercise parameters
export interface ExerciseParam {
	key: string;
	value: string;
	editable: boolean;  // true if wrapped in [brackets]
	unit?: string;
}

// Parsed metadata from the workout block header
export interface WorkoutMetadata {
	title?: string;
	state: WorkoutState;
	startDate?: string;   // ISO format or human readable
	duration?: string;    // e.g., "11m 33s"
	restDuration?: number; // Default rest duration in seconds
}

// Single exercise entry
export interface Exercise {
	state: ExerciseState;
	name: string;
	params: ExerciseParam[];
	targetDuration?: number;     // Target duration in seconds (for countdown)
	recordedDuration?: string;   // Recorded duration after completion
	lineIndex: number;           // Line index relative to exercise section start
}

// Complete parsed workout block
export interface ParsedWorkout {
	metadata: WorkoutMetadata;
	exercises: Exercise[];
	rawLines: string[];          // Preserve original lines for reconstruction
	metadataEndIndex: number;    // Line index where metadata section ends (after ---)
}

// Pomodoro phase
export type PomodoroPhase = 'work' | 'break' | 'longBreak';

// Timer instance for a workout
export interface TimerInstance {
	workoutId: string;
	workoutStartTime: number;
	exerciseStartTime: number;
	exercisePausedTime: number;
	isPaused: boolean;
	activeExerciseIndex: number;
	callbacks: Set<TimerCallback>;

	// Pomodoro state
	pomodoroEnabled: boolean;
	pomodoroPhase: PomodoroPhase;
	pomodoroCycle: number;
	pomodoroWorkDuration: number;
	pomodoroBreakDuration: number;
	pomodoroPhaseStartTime: number;
	pomodoroPausedTime: number;
}

// Timer state passed to UI
export interface TimerState {
	workoutElapsed: number;
	exerciseElapsed: number;
	remaining?: number;
	isOvertime: boolean;

	// Pomodoro state
	pomodoroEnabled?: boolean;
	pomodoroPhase?: PomodoroPhase;
	pomodoroCycle?: number;
	pomodoroElapsed?: number;
	pomodoroRemaining?: number;
	pomodoroProgress?: number;
}

export type TimerCallback = (state: TimerState) => void;

// Callbacks for workout interactions
export interface WorkoutCallbacks {
	onStartWorkout: () => Promise<void>;
	onFinishWorkout: () => Promise<void>;
	onExerciseFinish: (exerciseIndex: number) => Promise<void>;
	onExerciseAddSet: (exerciseIndex: number) => Promise<void>;
	onExerciseAddRest: (exerciseIndex: number) => Promise<void>;
	onExerciseSkip: (exerciseIndex: number) => Promise<void>;
	onParamChange: (exerciseIndex: number, paramKey: string, newValue: string) => void;
	onFlushChanges: () => Promise<void>;
	onPauseExercise: () => void;
	onResumeExercise: () => void;
	onAddSample: () => Promise<void>;
}

// Context passed to renderer
export interface RenderContext {
	el: HTMLElement;
	parsed: ParsedWorkout;
	callbacks: WorkoutCallbacks;
	workoutId: string;
	app: App;
	timerState?: TimerState;
	timerStyle?: TimerStyle;
}

// Section info from Obsidian
export interface SectionInfo {
	lineStart: number;
	lineEnd: number;
}

// File update context
export interface UpdateContext {
	app: App;
	sourcePath: string;
	sectionInfo: SectionInfo | null;
}

// ============================================
// STUDY LOG TYPES (new in v2.0)
// ============================================

export type StudyState = LogState;

export type StudyTaskState = 'pending' | 'inProgress' | 'completed' | 'skipped';

export interface SubjectPreset {
	name: string;
	icon: string;
	color: string;
	defaultTasks?: string[];
}

export interface StudyMetadata {
	title: string;
	subject: string;
	state: StudyState;
	startDate?: string;
	endDate?: string;
	totalDuration?: string;
	focusScore?: number;
	comprehensionScore?: number;
	tags?: string[];
}

export interface StudyTask {
	state: StudyTaskState;
	name: string;
	targetDuration?: number;
	recordedDuration?: string;
	notes?: string;
	lineIndex: number;
}

export interface ParsedStudyLog {
	metadata: StudyMetadata;
	tasks: StudyTask[];
	rawLines: string[];
	metadataEndIndex: number;
}

export interface StudyLogCallbacks {
	onStartStudy: () => Promise<void>;
	onFinishStudy: () => Promise<void>;
	onTaskFinish: (taskIndex: number) => Promise<void>;
	onTaskSkip: (taskIndex: number) => Promise<void>;
	onPauseTask: () => void;
	onResumeTask: () => void;
	onFlushChanges: () => Promise<void>;
	onOpenSelfEval: () => void;
}

export interface StudyRenderContext {
	el: HTMLElement;
	parsed: ParsedStudyLog;
	callbacks: StudyLogCallbacks;
	studyId: string;
	timerState?: TimerState;
	timerStyle?: TimerStyle;
}

// ============================================
// WORK LOG TYPES (new in v2.5)
// ============================================

export type WorkState = LogState;

export type WorkTaskState = 'pending' | 'inProgress' | 'completed' | 'skipped';

export type WorkPriority = 'high' | 'medium' | 'low';

export interface WorkMetadata {
	title: string;
	state: WorkState;
	startDate?: string;
	endDate?: string;
	totalDuration?: string;
	tags?: string[];
}

export interface WorkTask {
	state: WorkTaskState;
	name: string;
	priority: WorkPriority;
	expectedDuration?: number;    // Expected duration in seconds
	actualDuration?: string;      // Recorded actual duration
	notes?: string;
	lineIndex: number;
}

export interface ParsedWorkLog {
	metadata: WorkMetadata;
	tasks: WorkTask[];
	rawLines: string[];
	metadataEndIndex: number;
}

export interface WorkLogCallbacks {
	onStartWork: () => Promise<void>;
	onFinishWork: () => Promise<void>;
	onTaskFinish: (taskIndex: number) => Promise<void>;
	onTaskSkip: (taskIndex: number) => Promise<void>;
	onPauseTask: () => void;
	onResumeTask: () => void;
	onFlushChanges: () => Promise<void>;
}

export interface WorkRenderContext {
	el: HTMLElement;
	parsed: ParsedWorkLog;
	callbacks: WorkLogCallbacks;
	workId: string;
	timerState?: TimerState;
	timerStyle?: TimerStyle;
}

// ============================================
// MEAL LOG TYPES (new in v2.6)
// ============================================

export type MealState = LogState;

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type FoodItemState = 'pending' | 'completed';

export interface MealMetadata {
	title: string;
	mealType: MealType;
	state: MealState;
	date?: string;
	photo?: string;  // Obsidian image embed format: ![[image.jpg]]
	notes?: string;
}

export interface FoodItem {
	state: FoodItemState;
	name: string;
	lineIndex: number;
}

export interface ParsedMealLog {
	metadata: MealMetadata;
	foods: FoodItem[];
	rawLines: string[];
	metadataEndIndex: number;
}

export interface MealLogCallbacks {
	onCompleteMeal: () => Promise<void>;
	onFoodToggle: (foodIndex: number) => Promise<void>;
	onAddFood: (foodName: string) => Promise<void>;
	onRemoveFood: (foodIndex: number) => Promise<void>;
	onPhotoChange: (photoPath: string) => Promise<void>;
	onFlushChanges: () => Promise<void>;
}

export interface MealRenderContext {
	el: HTMLElement;
	parsed: ParsedMealLog;
	callbacks: MealLogCallbacks;
	mealId: string;
	app: App;
}

// ============================================
// TIMER STYLE TYPES (new in v2.5)
// ============================================

export type TimerStyle = 'digital' | 'pomodoro' | 'analog';

// ============================================
// AI ANALYSIS TYPES (new in v2.7)
// ============================================

export type AIProviderType = 'openai' | 'gemini' | 'grok' | 'openrouter';

export type LogCategory = 'study' | 'workout' | 'work' | 'meal';

export type AnalysisDataRange = 'day' | 'week' | 'month' | 'quarter' | 'custom';

export interface DateRange {
	start: Date;
	end: Date;
}

// AI Provider related types
export interface AIProviderConfig {
	apiKey: string;
	model: string;
	customModels?: string[];  // For OpenRouter
}

export interface AnalysisOptions {
	model?: string;
	temperature?: number;
	maxTokens?: number;
	systemPrompt?: string;
}

export interface AnalysisResult {
	success: boolean;
	content: string;
	metadata: {
		provider: string;
		model: string;
		tokensUsed?: number;
		generatedAt: string;
	};
	error?: string;
}

// Template types
export interface AnalysisTemplate {
	id: string;
	name: string;
	category: LogCategory | 'custom';
	description: string;
	isBuiltIn: boolean;
	isEnabled: boolean;

	// Prompt settings
	systemPrompt: string;
	userPromptTemplate: string;

	// Data collection settings
	dataRange: AnalysisDataRange;
	customDays?: number;

	// Output settings
	outputFormat: 'markdown' | 'bullet-points' | 'structured';
	outputSections: string[];

	// Metadata
	createdAt: string;
	updatedAt: string;
	usageCount: number;
}

// Data summary types
export interface DataSummary {
	period: DateRange;
	recordCount: number;
	totalDuration: string;
	category: LogCategory;
}

// Analysis request
export interface AnalysisRequest {
	category: LogCategory;
	template: AnalysisTemplate;
	dateRange: DateRange;
	providerType: AIProviderType;
	model?: string;
}

// Study analysis data
export interface StudyAnalysisData {
	period: DateRange;
	sessions: ParsedStudyLog[];
	subjectStats: { subject: string; duration: number; count: number }[];
	totalStudyTime: number;
	pomodoroCount: number;
	scores: { understanding: number; effort: number; satisfaction: number }[];
}

// Workout analysis data
export interface WorkoutAnalysisData {
	period: DateRange;
	workouts: ParsedWorkout[];
	exerciseStats: { name: string; totalSets: number; totalReps: number }[];
	totalDuration: number;
	completionRate: number;
}

// Work analysis data
export interface WorkAnalysisData {
	period: DateRange;
	tasks: ParsedWorkLog[];
	categoryStats: { category: string; duration: number; count: number }[];
	totalWorkTime: number;
	overtimeCount: number;
	completionRate: number;
}

// Meal analysis data
export interface MealAnalysisData {
	period: DateRange;
	meals: ParsedMealLog[];
	mealTypeStats: { type: MealType; count: number }[];
	foodFrequency: { name: string; count: number }[];
	regularityScore: number;
}

// ============================================
// PLUGIN SETTINGS
// ============================================

export interface WorkoutTemplate {
	name: string;
	exercises: { name: string; params: string }[];
}

export interface LifeLogSettings {
	logFolder: string;
	dateFormat: string;

	subjects: SubjectPreset[];
	defaultStudyDuration: number;
	enablePomodoro: boolean;
	pomodoroWork: number;
	pomodoroBreak: number;

	defaultRestDuration: number;
	workoutTemplates: WorkoutTemplate[];

	defaultTab: 'study' | 'work' | 'workout';
	showRibbonIcon: boolean;

	enableTimerSound: boolean;
	enableNotifications: boolean;

	// Timer style settings (new in v2.5)
	timerStyle: TimerStyle;
	usePerTypeTimerStyle: boolean;
	studyTimerStyle: TimerStyle;
	workTimerStyle: TimerStyle;
	workoutTimerStyle: TimerStyle;

	// AI Analysis settings (new in v2.7)
	aiAnalysis: AIAnalysisSettings;
}

export interface AIAnalysisSettings {
	// Default provider
	defaultProvider: AIProviderType;

	// OpenAI settings
	openaiApiKey: string;
	openaiModel: string;

	// Gemini settings
	geminiApiKey: string;
	geminiModel: string;

	// Grok settings
	grokApiKey: string;
	grokModel: string;

	// OpenRouter settings
	openRouterApiKey: string;
	openRouterModel: string;
	openRouterCustomModels: string[];

	// Analysis settings
	autoAnalysis: boolean;
	analysisSchedule: 'daily' | 'weekly' | 'manual';

	// Template settings
	enabledTemplates: string[];
	customTemplates: AnalysisTemplate[];

	// Report settings
	reportSavePath: string;
	reportNaming: string;
}
