import { App } from 'obsidian';
import { ParsedWorkLog, LogCategory, WorkAnalysisData, DateRange } from '../../types';
import { parseWorkLog } from '../../parser/work';
import { BaseCollector, CollectionResult } from './base';

/**
 * 업무 로그 수집기
 */
export class WorkCollector extends BaseCollector<ParsedWorkLog> {
	readonly category: LogCategory = 'work';
	readonly codeBlockType = 'work-log';

	constructor(app: App, logFolder: string) {
		super(app, logFolder);
	}

	protected parseBlock(content: string): ParsedWorkLog | null {
		try {
			const parsed = parseWorkLog(content);
			// 유효한 업무 로그인지 확인
			if (parsed.metadata.title || parsed.tasks.length > 0) {
				return parsed;
			}
			return null;
		} catch (error) {
			console.error('Error parsing work log:', error);
			return null;
		}
	}

	protected extractDate(data: ParsedWorkLog): Date | null {
		return this.parseDateString(data.metadata.startDate);
	}

	/**
	 * 분석용 데이터로 변환
	 */
	async collectForAnalysis(dateRange: DateRange): Promise<WorkAnalysisData> {
		const result = await this.collect(dateRange);

		// 카테고리(태그)별 통계
		const categoryMap = new Map<string, { duration: number; count: number }>();
		let totalWorkTime = 0;
		let overtimeCount = 0;
		let completedCount = 0;
		let totalCount = 0;

		for (const log of result.logs) {
			const data = log.data;
			totalCount++;

			// 총 업무 시간 계산
			const duration = this.parseDurationToSeconds(data.metadata.totalDuration);
			totalWorkTime += duration;

			// 완료 여부
			if (data.metadata.state === 'completed') {
				completedCount++;
			}

			// 태스크별 초과 근무 확인
			for (const task of data.tasks) {
				if (task.expectedDuration && task.actualDuration) {
					const expected = task.expectedDuration;
					const actual = this.parseDurationToSeconds(task.actualDuration);
					if (actual > expected * 1.2) { // 20% 이상 초과
						overtimeCount++;
					}
				}
			}

			// 태그별 통계
			const tags = data.metadata.tags || ['미분류'];
			for (const tag of tags) {
				const stats = categoryMap.get(tag) || { duration: 0, count: 0 };
				stats.duration += duration / tags.length; // 태그 수로 분배
				stats.count += 1;
				categoryMap.set(tag, stats);
			}
		}

		const categoryStats = Array.from(categoryMap.entries()).map(([category, stats]) => ({
			category,
			duration: Math.round(stats.duration),
			count: stats.count,
		}));

		// 시간순 정렬
		categoryStats.sort((a, b) => b.duration - a.duration);

		const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

		return {
			period: dateRange,
			tasks: result.logs.map(l => l.data),
			categoryStats,
			totalWorkTime,
			overtimeCount,
			completionRate,
		};
	}

	/**
	 * JSON 형식으로 변환 (AI 분석용)
	 */
	toJSON(result: CollectionResult<ParsedWorkLog>): string {
		const simplified = result.logs.map(log => ({
			date: log.date.toISOString().split('T')[0],
			title: log.data.metadata.title,
			state: log.data.metadata.state,
			totalDuration: log.data.metadata.totalDuration,
			tasks: log.data.tasks.map(t => ({
				name: t.name,
				state: t.state,
				priority: t.priority,
				expectedDuration: t.expectedDuration,
				actualDuration: t.actualDuration,
				notes: t.notes,
			})),
			tags: log.data.metadata.tags,
		}));

		return JSON.stringify(simplified, null, 2);
	}
}
