import { App } from 'obsidian';
import { ParsedMealLog, LogCategory, MealAnalysisData, DateRange, MealType } from '../../types';
import { parseMealLog } from '../../parser/meal';
import { BaseCollector, CollectionResult } from './base';

/**
 * 식단 로그 수집기
 */
export class MealCollector extends BaseCollector<ParsedMealLog> {
	readonly category: LogCategory = 'meal';
	readonly codeBlockType = 'meal-log';

	constructor(app: App, logFolder: string) {
		super(app, logFolder);
	}

	protected parseBlock(content: string): ParsedMealLog | null {
		try {
			const parsed = parseMealLog(content);
			// 유효한 식단 로그인지 확인
			if (parsed.metadata.title || parsed.foods.length > 0) {
				return parsed;
			}
			return null;
		} catch (error) {
			console.error('Error parsing meal log:', error);
			return null;
		}
	}

	protected extractDate(data: ParsedMealLog): Date | null {
		return this.parseDateString(data.metadata.date);
	}

	/**
	 * 분석용 데이터로 변환
	 */
	async collectForAnalysis(dateRange: DateRange): Promise<MealAnalysisData> {
		const result = await this.collect(dateRange);

		// 식사 유형별 통계
		const mealTypeMap = new Map<MealType, number>();
		const foodMap = new Map<string, number>();

		// 규칙성 계산을 위한 일별 식사 횟수
		const dailyMeals = new Map<string, number>();

		for (const log of result.logs) {
			const data = log.data;
			const dateKey = log.date.toISOString().split('T')[0] ?? '';

			// 식사 유형별 카운트
			const mealType = data.metadata.mealType;
			mealTypeMap.set(mealType, (mealTypeMap.get(mealType) || 0) + 1);

			// 일별 식사 횟수
			if (dateKey) {
				dailyMeals.set(dateKey, (dailyMeals.get(dateKey) || 0) + 1);
			}

			// 음식별 빈도
			for (const food of data.foods) {
				const name = food.name.toLowerCase().trim();
				foodMap.set(name, (foodMap.get(name) || 0) + 1);
			}
		}

		const mealTypeStats: { type: MealType; count: number }[] = [
			{ type: 'breakfast', count: mealTypeMap.get('breakfast') || 0 },
			{ type: 'lunch', count: mealTypeMap.get('lunch') || 0 },
			{ type: 'dinner', count: mealTypeMap.get('dinner') || 0 },
			{ type: 'snack', count: mealTypeMap.get('snack') || 0 },
		];

		const foodFrequency = Array.from(foodMap.entries())
			.map(([name, count]) => ({ name, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 20); // 상위 20개

		// 규칙성 점수 계산 (하루 3끼 기준)
		const totalDays = dailyMeals.size;
		let regularDays = 0;
		for (const count of dailyMeals.values()) {
			if (count >= 3) regularDays++;
		}
		const regularityScore = totalDays > 0 ? Math.round((regularDays / totalDays) * 100) : 0;

		return {
			period: dateRange,
			meals: result.logs.map(l => l.data),
			mealTypeStats,
			foodFrequency,
			regularityScore,
		};
	}

	/**
	 * JSON 형식으로 변환 (AI 분석용)
	 */
	toJSON(result: CollectionResult<ParsedMealLog>): string {
		const simplified = result.logs.map(log => ({
			date: log.date.toISOString().split('T')[0],
			title: log.data.metadata.title,
			mealType: log.data.metadata.mealType,
			state: log.data.metadata.state,
			foods: log.data.foods.map(f => f.name),
			notes: log.data.metadata.notes,
		}));

		return JSON.stringify(simplified, null, 2);
	}
}
