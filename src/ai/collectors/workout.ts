import { App } from 'obsidian';
import { ParsedWorkout, LogCategory, WorkoutAnalysisData, DateRange } from '../../types';
import { parseWorkout } from '../../parser';
import { BaseCollector, CollectionResult } from './base';

/**
 * 운동 로그 수집기
 */
export class WorkoutCollector extends BaseCollector<ParsedWorkout> {
	readonly category: LogCategory = 'workout';
	readonly codeBlockType = 'life-log';

	constructor(app: App, logFolder: string) {
		super(app, logFolder);
	}

	protected parseBlock(content: string): ParsedWorkout | null {
		try {
			const parsed = parseWorkout(content);
			// 유효한 운동 로그인지 확인
			if (parsed.metadata.title || parsed.exercises.length > 0) {
				return parsed;
			}
			return null;
		} catch (error) {
			console.error('Error parsing workout log:', error);
			return null;
		}
	}

	protected extractDate(data: ParsedWorkout): Date | null {
		return this.parseDateString(data.metadata.startDate);
	}

	/**
	 * 분석용 데이터로 변환
	 */
	async collectForAnalysis(dateRange: DateRange): Promise<WorkoutAnalysisData> {
		const result = await this.collect(dateRange);

		// 운동별 통계
		const exerciseMap = new Map<string, { totalSets: number; totalReps: number }>();
		let totalDuration = 0;
		let completedCount = 0;
		let totalCount = 0;

		for (const log of result.logs) {
			const data = log.data;
			totalCount++;

			// 총 운동 시간 계산
			const duration = this.parseDurationToSeconds(data.metadata.duration);
			totalDuration += duration;

			// 완료 여부
			if (data.metadata.state === 'completed') {
				completedCount++;
			}

			// 운동별 통계
			for (const exercise of data.exercises) {
				const name = exercise.name;
				const stats = exerciseMap.get(name) || { totalSets: 0, totalReps: 0 };

				stats.totalSets += 1;

				// reps 파라미터 찾기
				const repsParam = exercise.params.find(p =>
					p.key.toLowerCase().includes('rep') ||
					p.key.toLowerCase().includes('횟수')
				);
				if (repsParam) {
					const reps = parseInt(repsParam.value) || 0;
					stats.totalReps += reps;
				}

				exerciseMap.set(name, stats);
			}
		}

		const exerciseStats = Array.from(exerciseMap.entries()).map(([name, stats]) => ({
			name,
			totalSets: stats.totalSets,
			totalReps: stats.totalReps,
		}));

		// 세트 수순 정렬
		exerciseStats.sort((a, b) => b.totalSets - a.totalSets);

		const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

		return {
			period: dateRange,
			workouts: result.logs.map(l => l.data),
			exerciseStats,
			totalDuration,
			completionRate,
		};
	}

	/**
	 * JSON 형식으로 변환 (AI 분석용)
	 */
	toJSON(result: CollectionResult<ParsedWorkout>): string {
		const simplified = result.logs.map(log => ({
			date: log.date.toISOString().split('T')[0],
			title: log.data.metadata.title,
			state: log.data.metadata.state,
			duration: log.data.metadata.duration,
			exercises: log.data.exercises.map(e => ({
				name: e.name,
				state: e.state,
				params: e.params.reduce((acc, p) => {
					acc[p.key] = p.value + (p.unit ? ` ${p.unit}` : '');
					return acc;
				}, {} as Record<string, string>),
				duration: e.recordedDuration,
			})),
		}));

		return JSON.stringify(simplified, null, 2);
	}
}
