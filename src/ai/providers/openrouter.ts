import { AnalysisOptions, AnalysisResult, AIProviderType } from '../../types';
import { BaseAIProvider, fetchWithTimeout } from './base';

interface OpenRouterMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

interface OpenRouterResponse {
	id: string;
	choices: {
		message: {
			content: string;
		};
		finish_reason: string;
	}[];
	usage?: {
		total_tokens: number;
	};
	error?: {
		message: string;
		code?: string;
	};
}

/**
 * OpenRouter Provider - 다양한 AI 모델을 지원하는 통합 API
 */
export class OpenRouterProvider extends BaseAIProvider {
	readonly name = 'OpenRouter';
	readonly type: AIProviderType = 'openrouter';

	private static readonly API_URL = 'https://openrouter.ai/api/v1/chat/completions';
	private static readonly DEFAULT_MODELS = [
		'anthropic/claude-sonnet-4',
		'anthropic/claude-opus-4',
		'openai/gpt-5',
		'openai/o3',
		'google/gemini-2.5-pro',
		'google/gemini-3-flash-preview',
		'meta-llama/llama-4-maverick',
		'deepseek/deepseek-r1',
	];

	private customModels: string[];

	constructor(apiKey: string, model: string, customModels: string[] = []) {
		super(apiKey, model);
		this.customModels = customModels;
	}

	getAvailableModels(): string[] {
		const allModels = [...OpenRouterProvider.DEFAULT_MODELS];
		for (const model of this.customModels) {
			if (model && !allModels.includes(model)) {
				allModels.push(model);
			}
		}
		return allModels;
	}

	async testConnection(): Promise<boolean> {
		if (!this.isConfigured()) return false;

		try {
			const response = await fetchWithTimeout(
				'https://openrouter.ai/api/v1/auth/key',
				{
					method: 'GET',
					headers: {
						'Authorization': `Bearer ${this.apiKey}`,
					},
				},
				10000
			);
			return response.ok;
		} catch {
			return false;
		}
	}

	/**
	 * OpenRouter 계정 잔액 확인
	 */
	async getCredits(): Promise<number | null> {
		if (!this.isConfigured()) return null;

		try {
			const response = await fetchWithTimeout(
				'https://openrouter.ai/api/v1/auth/key',
				{
					method: 'GET',
					headers: {
						'Authorization': `Bearer ${this.apiKey}`,
					},
				},
				10000
			);

			if (response.ok) {
				const data = await response.json();
				return data.data?.limit_remaining ?? null;
			}
			return null;
		} catch {
			return null;
		}
	}

	async analyze(prompt: string, options?: AnalysisOptions): Promise<AnalysisResult> {
		if (!this.isConfigured()) {
			return this.createResult(false, '', undefined, 'API 키가 설정되지 않았습니다.');
		}

		try {
			const messages: OpenRouterMessage[] = [];

			if (options?.systemPrompt) {
				messages.push({
					role: 'system',
					content: options.systemPrompt,
				});
			}

			messages.push({
				role: 'user',
				content: prompt,
			});

			const response = await fetchWithTimeout(
				OpenRouterProvider.API_URL,
				{
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${this.apiKey}`,
						'Content-Type': 'application/json',
						'HTTP-Referer': 'https://obsidian.md',
						'X-Title': 'Life Log Plugin',
					},
					body: JSON.stringify({
						model: options?.model || this.model,
						messages,
						temperature: options?.temperature ?? 0.7,
						max_tokens: options?.maxTokens ?? 4096,
					}),
				}
			);

			const data: OpenRouterResponse = await response.json();

			if (!response.ok || data.error) {
				return this.createResult(
					false,
					'',
					undefined,
					data.error?.message || `HTTP ${response.status}`
				);
			}

			const content = data.choices[0]?.message?.content || '';
			const tokensUsed = data.usage?.total_tokens;

			return this.createResult(true, content, tokensUsed);
		} catch (error) {
			return this.createErrorResult(error);
		}
	}
}
