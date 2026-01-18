import { AIProviderType, AIAnalysisSettings } from '../../types';
import { AIProvider } from './base';
import { OpenAIProvider } from './openai';
import { GeminiProvider } from './gemini';
import { GrokProvider } from './grok';
import { OpenRouterProvider } from './openrouter';

export type { AIProvider } from './base';
export { BaseAIProvider } from './base';
export { OpenAIProvider } from './openai';
export { GeminiProvider } from './gemini';
export { GrokProvider } from './grok';
export { OpenRouterProvider } from './openrouter';

/**
 * AI Provider Factory
 * 설정에 따라 적절한 AI Provider 인스턴스를 생성합니다.
 */
export class AIProviderFactory {
	/**
	 * 특정 타입의 Provider 생성
	 */
	static createProvider(
		type: AIProviderType,
		settings: AIAnalysisSettings
	): AIProvider {
		switch (type) {
			case 'openai':
				return new OpenAIProvider(
					settings.openaiApiKey,
					settings.openaiModel
				);

			case 'gemini':
				return new GeminiProvider(
					settings.geminiApiKey,
					settings.geminiModel
				);

			case 'grok':
				return new GrokProvider(
					settings.grokApiKey,
					settings.grokModel
				);

			case 'openrouter':
				return new OpenRouterProvider(
					settings.openRouterApiKey,
					settings.openRouterModel,
					settings.openRouterCustomModels
				);

			default:
				throw new Error(`Unknown provider type: ${type}`);
		}
	}

	/**
	 * 기본 설정된 Provider 생성
	 */
	static createDefaultProvider(settings: AIAnalysisSettings): AIProvider {
		return this.createProvider(settings.defaultProvider, settings);
	}

	/**
	 * 모든 설정된 Provider 목록 생성
	 */
	static getConfiguredProviders(settings: AIAnalysisSettings): AIProvider[] {
		const providers: AIProvider[] = [];

		if (settings.openaiApiKey) {
			providers.push(this.createProvider('openai', settings));
		}
		if (settings.geminiApiKey) {
			providers.push(this.createProvider('gemini', settings));
		}
		if (settings.grokApiKey) {
			providers.push(this.createProvider('grok', settings));
		}
		if (settings.openRouterApiKey) {
			providers.push(this.createProvider('openrouter', settings));
		}

		return providers;
	}

	/**
	 * Provider 이름 반환
	 */
	static getProviderName(type: AIProviderType): string {
		switch (type) {
			case 'openai':
				return 'OpenAI';
			case 'gemini':
				return 'Google Gemini';
			case 'grok':
				return 'xAI Grok';
			case 'openrouter':
				return 'OpenRouter';
			default:
				return type;
		}
	}

	/**
	 * Provider가 설정되었는지 확인
	 */
	static isProviderConfigured(
		type: AIProviderType,
		settings: AIAnalysisSettings
	): boolean {
		switch (type) {
			case 'openai':
				return !!settings.openaiApiKey;
			case 'gemini':
				return !!settings.geminiApiKey;
			case 'grok':
				return !!settings.grokApiKey;
			case 'openrouter':
				return !!settings.openRouterApiKey;
			default:
				return false;
		}
	}
}
