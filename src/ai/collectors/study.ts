import { App } from 'obsidian';
import { ParsedStudyLog, LogCategory, StudyAnalysisData, DateRange } from '../../types';
import { parseStudyLog } from '../../parser/study';
import { BaseCollector, CollectionResult } from './base';

/**
 * 학습 로그 수집기
 */
export class StudyCollector extends BaseCollector<ParsedStudyLog> {
	readonly category: LogCategory = 'study';
	readonly codeBlockType = 'study-log';

	constructor(app: App, logFolder: string) {
		super(app, logFolder);
	}

	protected parseBlock(content: string): ParsedStudyLog | null {
		try {
			const parsed = parseStudyLog(content);
			// 유효한 학습 로그인지 확인
			if (parsed.metadata.title || parsed.tasks.length > 0) {
				return parsed;
			}
			return null;
		} catch (error) {
			console.error('Error parsing study log:', error);
			return null;
		}
	}

	protected extractDate(data: ParsedStudyLog): Date | null {
		return this.parseDateString(data.metadata.startDate);
	}

	/**
	 * 분석용 데이터로 변환
	 */
	async collectForAnalysis(dateRange: DateRange): Promise<StudyAnalysisData> {
		const result = await this.collect(dateRange);

		// 과목별 통계
		const subjectMap = new Map<string, { duration: number; count: number }>();
		let totalStudyTime = 0;
		let pomodoroCount = 0;
		const scores: { understanding: number; effort: number; satisfaction: number }[] = [];

		for (const log of result.logs) {
			const data = log.data;
			const subject = data.metadata.subject || '기타';

			// 총 학습 시간 계산
			const duration = this.parseDurationToSeconds(data.metadata.totalDuration);
			totalStudyTime += duration;

			// 과목별 통계
			const subjectStats = subjectMap.get(subject) || { duration: 0, count: 0 };
			subjectStats.duration += duration;
			subjectStats.count += 1;
			subjectMap.set(subject, subjectStats);

			// 점수 수집
			if (data.metadata.focusScore !== undefined || data.metadata.comprehensionScore !== undefined) {
				scores.push({
					understanding: data.metadata.comprehensionScore || 0,
					effort: data.metadata.focusScore || 0,
					satisfaction: Math.round((data.metadata.focusScore || 0) * 0.5 + (data.metadata.comprehensionScore || 0) * 0.5),
				});
			}

			// 완료된 태스크 기반 포모도로 카운트 추정
			const completedTasks = data.tasks.filter(t => t.state === 'completed');
			pomodoroCount += completedTasks.length;
		}

		const subjectStats = Array.from(subjectMap.entries()).map(([subject, stats]) => ({
			subject,
			duration: stats.duration,
			count: stats.count,
		}));

		// 학습 시간순 정렬
		subjectStats.sort((a, b) => b.duration - a.duration);

		return {
			period: dateRange,
			sessions: result.logs.map(l => l.data),
			subjectStats,
			totalStudyTime,
			pomodoroCount,
			scores,
		};
	}

	/**
	 * JSON 형식으로 변환 (AI 분석용)
	 */
	toJSON(result: CollectionResult<ParsedStudyLog>): string {
		const simplified = result.logs.map(log => ({
			date: log.date.toISOString().split('T')[0],
			title: log.data.metadata.title,
			subject: log.data.metadata.subject,
			state: log.data.metadata.state,
			totalDuration: log.data.metadata.totalDuration,
			focusScore: log.data.metadata.focusScore,
			comprehensionScore: log.data.metadata.comprehensionScore,
			tasks: log.data.tasks.map(t => ({
				name: t.name,
				state: t.state,
				duration: t.recordedDuration,
			})),
			tags: log.data.metadata.tags,
		}));

		return JSON.stringify(simplified, null, 2);
	}
}
