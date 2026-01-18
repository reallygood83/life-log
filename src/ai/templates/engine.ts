import { AnalysisTemplate, DateRange, LogCategory } from '../../types';

/**
 * 템플릿 변수 치환에 사용되는 컨텍스트
 */
export interface TemplateContext {
	period: string;           // 분석 기간 문자열
	category: LogCategory;    // 기록 카테고리
	recordCount: number;      // 기록 개수
	totalDuration: string;    // 총 시간
	rawData: string;          // JSON 데이터 문자열
	summary: string;          // 자동 생성 요약
	userName?: string;        // 사용자 이름
	currentDate: string;      // 현재 날짜
}

/**
 * 템플릿 엔진
 * 템플릿 문자열에서 변수를 실제 값으로 치환합니다.
 */
export class TemplateEngine {
	/**
	 * 템플릿 문자열의 변수를 치환
	 */
	static render(template: string, context: TemplateContext): string {
		let result = template;

		// 모든 변수 치환
		result = result.replace(/\{\{period\}\}/g, context.period);
		result = result.replace(/\{\{category\}\}/g, context.category);
		result = result.replace(/\{\{recordCount\}\}/g, String(context.recordCount));
		result = result.replace(/\{\{totalDuration\}\}/g, context.totalDuration);
		result = result.replace(/\{\{rawData\}\}/g, context.rawData);
		result = result.replace(/\{\{summary\}\}/g, context.summary);
		result = result.replace(/\{\{userName\}\}/g, context.userName || '사용자');
		result = result.replace(/\{\{currentDate\}\}/g, context.currentDate);

		return result;
	}

	/**
	 * 날짜 범위를 문자열로 변환
	 */
	static formatDateRange(dateRange: DateRange): string {
		const formatDate = (date: Date): string => {
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			return `${year}-${month}-${day}`;
		};

		return `${formatDate(dateRange.start)} ~ ${formatDate(dateRange.end)}`;
	}

	/**
	 * 현재 날짜 문자열 반환
	 */
	static getCurrentDateString(): string {
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	/**
	 * 시간(초)을 사람이 읽기 좋은 형식으로 변환
	 */
	static formatDuration(seconds: number): string {
		if (seconds < 60) {
			return `${seconds}초`;
		}

		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		const parts: string[] = [];
		if (hours > 0) {
			parts.push(`${hours}시간`);
		}
		if (minutes > 0) {
			parts.push(`${minutes}분`);
		}
		if (secs > 0 && hours === 0) {
			parts.push(`${secs}초`);
		}

		return parts.join(' ') || '0초';
	}

	/**
	 * 데이터 범위에 따른 날짜 범위 계산
	 */
	static calculateDateRange(
		dataRange: 'day' | 'week' | 'month' | 'quarter' | 'custom',
		customDays?: number
	): DateRange {
		const end = new Date();
		end.setHours(23, 59, 59, 999);

		const start = new Date();
		start.setHours(0, 0, 0, 0);

		switch (dataRange) {
			case 'day':
				// 오늘
				break;

			case 'week':
				// 지난 7일
				start.setDate(start.getDate() - 6);
				break;

			case 'month':
				// 지난 30일
				start.setDate(start.getDate() - 29);
				break;

			case 'quarter':
				// 지난 90일
				start.setDate(start.getDate() - 89);
				break;

			case 'custom':
				if (customDays && customDays > 0) {
					start.setDate(start.getDate() - (customDays - 1));
				}
				break;
		}

		return { start, end };
	}

	/**
	 * 템플릿 유효성 검사
	 */
	static validateTemplate(template: AnalysisTemplate): { valid: boolean; errors: string[] } {
		const errors: string[] = [];

		if (!template.id || template.id.trim() === '') {
			errors.push('템플릿 ID가 필요합니다.');
		}

		if (!template.name || template.name.trim() === '') {
			errors.push('템플릿 이름이 필요합니다.');
		}

		if (!template.userPromptTemplate || template.userPromptTemplate.trim() === '') {
			errors.push('사용자 프롬프트 템플릿이 필요합니다.');
		}

		// 필수 변수 확인
		if (!template.userPromptTemplate.includes('{{rawData}}')) {
			errors.push('프롬프트에 {{rawData}} 변수가 포함되어야 합니다.');
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	}

	/**
	 * 카테고리 이름 반환 (한국어)
	 */
	static getCategoryName(category: LogCategory): string {
		switch (category) {
			case 'study':
				return '학습';
			case 'workout':
				return '운동';
			case 'work':
				return '업무';
			case 'meal':
				return '식단';
			default:
				return category;
		}
	}
}
