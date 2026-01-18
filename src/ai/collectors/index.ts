import { App } from 'obsidian';
import { LogCategory, DateRange } from '../../types';
import { BaseCollector, CollectionResult, CollectedLog } from './base';
import { StudyCollector } from './study';
import { WorkoutCollector } from './workout';
import { WorkCollector } from './work';
import { MealCollector } from './meal';

export type { CollectedLog, CollectionResult, CodeBlockInfo } from './base';
export { BaseCollector } from './base';
export { StudyCollector } from './study';
export { WorkoutCollector } from './workout';
export { WorkCollector } from './work';
export { MealCollector } from './meal';

/**
 * 데이터 수집기 팩토리
 */
export class CollectorFactory {
	/**
	 * 카테고리에 맞는 수집기 생성
	 */
	static createCollector(
		category: LogCategory,
		app: App,
		logFolder: string
	): BaseCollector<unknown> {
		switch (category) {
			case 'study':
				return new StudyCollector(app, logFolder);
			case 'workout':
				return new WorkoutCollector(app, logFolder);
			case 'work':
				return new WorkCollector(app, logFolder);
			case 'meal':
				return new MealCollector(app, logFolder);
			default:
				throw new Error(`Unknown category: ${category}`);
		}
	}

	/**
	 * 모든 카테고리의 수집기 생성
	 */
	static createAllCollectors(app: App, logFolder: string): Map<LogCategory, BaseCollector<unknown>> {
		const collectors = new Map<LogCategory, BaseCollector<unknown>>();
		collectors.set('study', new StudyCollector(app, logFolder));
		collectors.set('workout', new WorkoutCollector(app, logFolder));
		collectors.set('work', new WorkCollector(app, logFolder));
		collectors.set('meal', new MealCollector(app, logFolder));
		return collectors;
	}
}

/**
 * 통합 데이터 수집 결과
 */
export interface UnifiedCollectionResult {
	study: CollectionResult<unknown> | null;
	workout: CollectionResult<unknown> | null;
	work: CollectionResult<unknown> | null;
	meal: CollectionResult<unknown> | null;
	totalRecords: number;
	dateRange: DateRange;
}

/**
 * 모든 카테고리의 데이터를 한 번에 수집
 */
export async function collectAllData(
	app: App,
	logFolder: string,
	dateRange: DateRange,
	categories?: LogCategory[]
): Promise<UnifiedCollectionResult> {
	const targetCategories = categories || ['study', 'workout', 'work', 'meal'] as LogCategory[];
	const collectors = CollectorFactory.createAllCollectors(app, logFolder);

	const result: UnifiedCollectionResult = {
		study: null,
		workout: null,
		work: null,
		meal: null,
		totalRecords: 0,
		dateRange,
	};

	for (const category of targetCategories) {
		const collector = collectors.get(category);
		if (collector) {
			const data = await collector.collect(dateRange);
			result[category] = data;
			result.totalRecords += data.totalCount;
		}
	}

	return result;
}

/**
 * 카테고리별 수집 데이터를 JSON 문자열로 변환
 */
export function collectionToJSON(
	category: LogCategory,
	collector: BaseCollector<unknown>,
	result: CollectionResult<unknown>
): string {
	switch (category) {
		case 'study':
			return (collector as StudyCollector).toJSON(result as CollectionResult<never>);
		case 'workout':
			return (collector as WorkoutCollector).toJSON(result as CollectionResult<never>);
		case 'work':
			return (collector as WorkCollector).toJSON(result as CollectionResult<never>);
		case 'meal':
			return (collector as MealCollector).toJSON(result as CollectionResult<never>);
		default:
			return JSON.stringify(result.logs.map(l => (l as CollectedLog<unknown>).data), null, 2);
	}
}
