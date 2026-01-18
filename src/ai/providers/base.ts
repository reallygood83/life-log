import { AnalysisOptions, AnalysisResult, AIProviderType } from '../../types';

/**
 * AI Provider 기본 인터페이스
 */
export interface AIProvider {
	readonly name: string;
	readonly type: AIProviderType;

	/**
	 * API 키가 설정되어 있는지 확인
	 */
	isConfigured(): boolean;

	/**
	 * 사용 가능한 모델 목록 반환
	 */
	getAvailableModels(): string[];

	/**
	 * 현재 설정된 모델 반환
	 */
	getCurrentModel(): string;

	/**
	 * API 연결 테스트
	 */
	testConnection(): Promise<boolean>;

	/**
	 * AI 분석 수행
	 */
	analyze(prompt: string, options?: AnalysisOptions): Promise<AnalysisResult>;
}

/**
 * AI Provider 기본 클래스
 */
export abstract class BaseAIProvider implements AIProvider {
	abstract readonly name: string;
	abstract readonly type: AIProviderType;

	protected apiKey: string;
	protected model: string;

	constructor(apiKey: string, model: string) {
		this.apiKey = apiKey;
		this.model = model;
	}

	isConfigured(): boolean {
		return !!this.apiKey && this.apiKey.length > 0;
	}

	abstract getAvailableModels(): string[];

	getCurrentModel(): string {
		return this.model;
	}

	abstract testConnection(): Promise<boolean>;

	abstract analyze(prompt: string, options?: AnalysisOptions): Promise<AnalysisResult>;

	/**
	 * 공통 분석 결과 생성 헬퍼
	 */
	protected createResult(
		success: boolean,
		content: string,
		tokensUsed?: number,
		error?: string
	): AnalysisResult {
		return {
			success,
			content,
			metadata: {
				provider: this.name,
				model: this.model,
				tokensUsed,
				generatedAt: new Date().toISOString(),
			},
			error,
		};
	}

	/**
	 * 에러 결과 생성 헬퍼
	 */
	protected createErrorResult(error: unknown): AnalysisResult {
		const message = error instanceof Error ? error.message : String(error);
		return this.createResult(false, '', undefined, message);
	}
}

/**
 * API 호출을 위한 공통 fetch 옵션
 */
export interface FetchOptions {
	method: 'GET' | 'POST';
	headers: Record<string, string>;
	body?: string;
}

/**
 * 공통 API 호출 헬퍼
 */
export async function fetchWithTimeout(
	url: string,
	options: FetchOptions,
	timeoutMs: number = 60000
): Promise<Response> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const response = await fetch(url, {
			...options,
			signal: controller.signal,
		});
		return response;
	} finally {
		clearTimeout(timeout);
	}
}
