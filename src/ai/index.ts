// AI Analysis Module Entry Point

// Providers
export {
	AIProviderFactory,
	BaseAIProvider,
	OpenAIProvider,
	GeminiProvider,
	GrokProvider,
	OpenRouterProvider,
} from './providers';
export type { AIProvider } from './providers';

// Templates
export {
	DEFAULT_TEMPLATES,
	STUDY_TEMPLATES,
	WORKOUT_TEMPLATES,
	WORK_TEMPLATES,
	MEAL_TEMPLATES,
	getTemplatesByCategory,
	getTemplateById,
	TemplateEngine,
} from './templates';
export type { TemplateContext } from './templates';

// Collectors
export {
	CollectorFactory,
	BaseCollector,
	StudyCollector,
	WorkoutCollector,
	WorkCollector,
	MealCollector,
	collectAllData,
	collectionToJSON,
} from './collectors';
export type {
	CollectedLog,
	CollectionResult,
	CodeBlockInfo,
	UnifiedCollectionResult,
} from './collectors';

// Engine
export { AIAnalysisEngine } from './engine';
export type { AnalysisProgress, ProgressCallback } from './engine';

// Modals
export { AIAnalysisModal } from './modals/AnalysisModal';
