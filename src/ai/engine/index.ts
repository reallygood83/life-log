import { App } from 'obsidian';
import {
	AnalysisRequest,
	AnalysisResult,
	LogCategory,
	DateRange,
	AIAnalysisSettings,
	AnalysisTemplate,
} from '../../types';
import { AIProviderFactory, AIProvider } from '../providers';
import { TemplateEngine, TemplateContext } from '../templates/engine';
import {
	CollectorFactory,
	StudyCollector,
	WorkoutCollector,
	WorkCollector,
	MealCollector,
	collectionToJSON,
} from '../collectors';

/**
 * 분석 진행 상태
 */
export interface AnalysisProgress {
	stage: 'collecting' | 'processing' | 'analyzing' | 'completed' | 'error';
	message: string;
	progress: number; // 0-100
}

export type ProgressCallback = (progress: AnalysisProgress) => void;

/**
 * AI 분석 엔진
 * 데이터 수집, 처리, AI 분석을 오케스트레이션합니다.
 */
export class AIAnalysisEngine {
	private app: App;
	private settings: AIAnalysisSettings;
	private logFolder: string;

	constructor(app: App, settings: AIAnalysisSettings, logFolder: string) {
		this.app = app;
		this.settings = settings;
		this.logFolder = logFolder;
	}

	/**
	 * 분석 실행
	 */
	async analyze(
		request: AnalysisRequest,
		onProgress?: ProgressCallback
	): Promise<AnalysisResult> {
		try {
			// 1단계: 데이터 수집
			onProgress?.({
				stage: 'collecting',
				message: '데이터를 수집하는 중...',
				progress: 10,
			});

			const collectedData = await this.collectData(
				request.category,
				request.dateRange
			);

			if (collectedData.totalCount === 0) {
				return this.createErrorResult(
					'선택한 기간에 데이터가 없습니다. 다른 기간을 선택해주세요.'
				);
			}

			// 2단계: 데이터 처리
			onProgress?.({
				stage: 'processing',
				message: '데이터를 처리하는 중...',
				progress: 30,
			});

			const processedData = await this.processData(
				request.category,
				collectedData
			);

			// 3단계: AI 분석
			onProgress?.({
				stage: 'analyzing',
				message: 'AI가 분석하는 중...',
				progress: 50,
			});

			const provider = this.createProvider(request.providerType);
			if (!provider.isConfigured()) {
				return this.createErrorResult(
					`${provider.name} API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.`
				);
			}

			const prompt = this.buildPrompt(
				request.template,
				request.category,
				request.dateRange,
				processedData
			);

			onProgress?.({
				stage: 'analyzing',
				message: 'AI 응답을 기다리는 중...',
				progress: 70,
			});

			const result = await provider.analyze(prompt, {
				systemPrompt: request.template.systemPrompt,
				model: request.model,
				temperature: 0.7,
				maxTokens: 4096,
			});

			// 4단계: 완료
			onProgress?.({
				stage: 'completed',
				message: '분석이 완료되었습니다!',
				progress: 100,
			});

			return result;
		} catch (error) {
			onProgress?.({
				stage: 'error',
				message: error instanceof Error ? error.message : '알 수 없는 오류',
				progress: 0,
			});

			return this.createErrorResult(
				error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
			);
		}
	}

	/**
	 * 데이터 수집
	 */
	private async collectData(category: LogCategory, dateRange: DateRange) {
		const collector = CollectorFactory.createCollector(
			category,
			this.app,
			this.logFolder
		);
		return await collector.collect(dateRange);
	}

	/**
	 * 데이터 처리 (JSON 변환)
	 */
	private async processData(
		category: LogCategory,
		collectedData: { logs: unknown[]; totalCount: number }
	): Promise<{ rawData: string; summary: string; totalDuration: string }> {
		const collector = CollectorFactory.createCollector(
			category,
			this.app,
			this.logFolder
		);

		// JSON으로 변환
		const rawData = collectionToJSON(category, collector, collectedData as never);

		// 요약 생성
		const summary = this.generateSummary(category, collectedData);

		// 총 시간 계산
		const totalDuration = await this.calculateTotalDuration(category, collectedData);

		return { rawData, summary, totalDuration };
	}

	/**
	 * 요약 생성
	 */
	private generateSummary(
		category: LogCategory,
		collectedData: { logs: unknown[]; totalCount: number }
	): string {
		const count = collectedData.totalCount;
		const categoryName = TemplateEngine.getCategoryName(category);

		switch (category) {
			case 'study':
				return `총 ${count}개의 학습 세션이 기록되었습니다.`;
			case 'workout':
				return `총 ${count}개의 운동 기록이 있습니다.`;
			case 'work':
				return `총 ${count}개의 업무 기록이 있습니다.`;
			case 'meal':
				return `총 ${count}개의 식사 기록이 있습니다.`;
			default:
				return `총 ${count}개의 ${categoryName} 기록이 있습니다.`;
		}
	}

	/**
	 * 총 시간 계산
	 */
	private async calculateTotalDuration(
		category: LogCategory,
		collectedData: { logs: unknown[] }
	): Promise<string> {
		let totalSeconds = 0;

		switch (category) {
			case 'study': {
				const collector = new StudyCollector(this.app, this.logFolder);
				const analysisData = await collector.collectForAnalysis({
					start: new Date(0),
					end: new Date(),
				});
				totalSeconds = analysisData.totalStudyTime;
				break;
			}
			case 'workout': {
				const collector = new WorkoutCollector(this.app, this.logFolder);
				const analysisData = await collector.collectForAnalysis({
					start: new Date(0),
					end: new Date(),
				});
				totalSeconds = analysisData.totalDuration;
				break;
			}
			case 'work': {
				const collector = new WorkCollector(this.app, this.logFolder);
				const analysisData = await collector.collectForAnalysis({
					start: new Date(0),
					end: new Date(),
				});
				totalSeconds = analysisData.totalWorkTime;
				break;
			}
			case 'meal':
				// 식사는 시간 개념이 없음
				return '해당 없음';
		}

		return TemplateEngine.formatDuration(totalSeconds);
	}

	/**
	 * 프롬프트 생성
	 */
	private buildPrompt(
		template: AnalysisTemplate,
		category: LogCategory,
		dateRange: DateRange,
		processedData: { rawData: string; summary: string; totalDuration: string }
	): string {
		const context: TemplateContext = {
			period: TemplateEngine.formatDateRange(dateRange),
			category,
			recordCount: JSON.parse(processedData.rawData).length,
			totalDuration: processedData.totalDuration,
			rawData: processedData.rawData,
			summary: processedData.summary,
			currentDate: TemplateEngine.getCurrentDateString(),
		};

		return TemplateEngine.render(template.userPromptTemplate, context);
	}

	/**
	 * Provider 생성
	 */
	private createProvider(providerType: string): AIProvider {
		return AIProviderFactory.createProvider(
			providerType as never,
			this.settings
		);
	}

	/**
	 * 에러 결과 생성
	 */
	private createErrorResult(message: string): AnalysisResult {
		return {
			success: false,
			content: '',
			metadata: {
				provider: '',
				model: '',
				generatedAt: new Date().toISOString(),
			},
			error: message,
		};
	}

	/**
	 * 사용 가능한 Provider 목록
	 */
	getAvailableProviders(): { type: string; name: string; configured: boolean }[] {
		const providers = [
			{ type: 'openai', name: 'OpenAI', key: this.settings.openaiApiKey },
			{ type: 'gemini', name: 'Google Gemini', key: this.settings.geminiApiKey },
			{ type: 'grok', name: 'xAI Grok', key: this.settings.grokApiKey },
			{ type: 'openrouter', name: 'OpenRouter', key: this.settings.openRouterApiKey },
		];

		return providers.map(p => ({
			type: p.type,
			name: p.name,
			configured: !!p.key,
		}));
	}
}
