import { AnalysisOptions, AnalysisResult, AIProviderType } from '../../types';
import { BaseAIProvider, fetchWithTimeout } from './base';

interface OpenAIMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

interface OpenAIResponse {
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
	};
}

/**
 * OpenAI Provider
 */
export class OpenAIProvider extends BaseAIProvider {
	readonly name = 'OpenAI';
	readonly type: AIProviderType = 'openai';

	private static readonly API_URL = 'https://api.openai.com/v1/chat/completions';
	private static readonly MODELS = [
		'gpt-5.2',
		'gpt-5',
		'o4-mini',
		'o3',
		'gpt-4o',
		'gpt-4o-mini',
	];

	getAvailableModels(): string[] {
		return OpenAIProvider.MODELS;
	}

	async testConnection(): Promise<boolean> {
		if (!this.isConfigured()) return false;

		try {
			const response = await fetchWithTimeout(
				'https://api.openai.com/v1/models',
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

	async analyze(prompt: string, options?: AnalysisOptions): Promise<AnalysisResult> {
		if (!this.isConfigured()) {
			return this.createResult(false, '', undefined, 'API 키가 설정되지 않았습니다.');
		}

		try {
			const messages: OpenAIMessage[] = [];

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
				OpenAIProvider.API_URL,
				{
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${this.apiKey}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						model: options?.model || this.model,
						messages,
						temperature: options?.temperature ?? 0.7,
						max_tokens: options?.maxTokens ?? 4096,
					}),
				}
			);

			const data: OpenAIResponse = await response.json();

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
