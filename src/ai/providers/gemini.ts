import { AnalysisOptions, AnalysisResult, AIProviderType } from '../../types';
import { BaseAIProvider, fetchWithTimeout } from './base';

interface GeminiContent {
	role: 'user' | 'model';
	parts: { text: string }[];
}

interface GeminiResponse {
	candidates?: {
		content: {
			parts: { text: string }[];
		};
		finishReason: string;
	}[];
	usageMetadata?: {
		totalTokenCount: number;
	};
	error?: {
		message: string;
	};
}

/**
 * Google Gemini Provider
 */
export class GeminiProvider extends BaseAIProvider {
	readonly name = 'Gemini';
	readonly type: AIProviderType = 'gemini';

	private static readonly API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
	private static readonly MODELS = [
		'gemini-2.0-flash',
		'gemini-1.5-pro',
		'gemini-1.5-flash',
		'gemini-1.0-pro',
	];

	getAvailableModels(): string[] {
		return GeminiProvider.MODELS;
	}

	async testConnection(): Promise<boolean> {
		if (!this.isConfigured()) return false;

		try {
			const response = await fetchWithTimeout(
				`${GeminiProvider.API_BASE}?key=${this.apiKey}`,
				{
					method: 'GET',
					headers: {},
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
			const modelName = options?.model || this.model;
			const contents: GeminiContent[] = [];

			// Gemini uses system instruction differently
			let systemInstruction: string | undefined;
			if (options?.systemPrompt) {
				systemInstruction = options.systemPrompt;
			}

			contents.push({
				role: 'user',
				parts: [{ text: prompt }],
			});

			const requestBody: Record<string, unknown> = {
				contents,
				generationConfig: {
					temperature: options?.temperature ?? 0.7,
					maxOutputTokens: options?.maxTokens ?? 8192,
				},
			};

			if (systemInstruction) {
				requestBody.systemInstruction = {
					parts: [{ text: systemInstruction }],
				};
			}

			const response = await fetchWithTimeout(
				`${GeminiProvider.API_BASE}/${modelName}:generateContent?key=${this.apiKey}`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
				}
			);

			const data: GeminiResponse = await response.json();

			if (!response.ok || data.error) {
				return this.createResult(
					false,
					'',
					undefined,
					data.error?.message || `HTTP ${response.status}`
				);
			}

			const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
			const tokensUsed = data.usageMetadata?.totalTokenCount;

			return this.createResult(true, content, tokensUsed);
		} catch (error) {
			return this.createErrorResult(error);
		}
	}
}
