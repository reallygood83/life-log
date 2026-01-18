import { App, TFile } from 'obsidian';
import { DateRange, LogCategory } from '../../types';

/**
 * 수집된 로그 데이터
 */
export interface CollectedLog<T> {
	file: TFile;
	filePath: string;
	data: T;
	date: Date;
}

/**
 * 수집 결과
 */
export interface CollectionResult<T> {
	logs: CollectedLog<T>[];
	totalCount: number;
	dateRange: DateRange;
	category: LogCategory;
}

/**
 * 코드 블록 정보
 */
export interface CodeBlockInfo {
	content: string;
	startLine: number;
	endLine: number;
}

/**
 * 베이스 데이터 수집기
 * Vault에서 특정 유형의 로그를 수집합니다.
 */
export abstract class BaseCollector<T> {
	protected app: App;
	protected logFolder: string;
	abstract readonly category: LogCategory;
	abstract readonly codeBlockType: string;

	constructor(app: App, logFolder: string) {
		this.app = app;
		this.logFolder = logFolder;
	}

	/**
	 * 날짜 범위 내의 모든 로그 수집
	 */
	async collect(dateRange: DateRange): Promise<CollectionResult<T>> {
		const logs: CollectedLog<T>[] = [];
		const files = this.app.vault.getMarkdownFiles();

		for (const file of files) {
			// 로그 폴더 내의 파일만 검색 (설정된 경우)
			if (this.logFolder && !file.path.startsWith(this.logFolder)) {
				continue;
			}

			try {
				const content = await this.app.vault.cachedRead(file);
				const codeBlocks = this.extractCodeBlocks(content);

				for (const block of codeBlocks) {
					const parsed = this.parseBlock(block.content);
					if (!parsed) continue;

					const logDate = this.extractDate(parsed);
					if (!logDate) continue;

					// 날짜 범위 필터링
					if (logDate >= dateRange.start && logDate <= dateRange.end) {
						logs.push({
							file,
							filePath: file.path,
							data: parsed,
							date: logDate,
						});
					}
				}
			} catch (error) {
				console.error(`Error reading file ${file.path}:`, error);
			}
		}

		// 날짜순 정렬
		logs.sort((a, b) => a.date.getTime() - b.date.getTime());

		return {
			logs,
			totalCount: logs.length,
			dateRange,
			category: this.category,
		};
	}

	/**
	 * 마크다운에서 코드 블록 추출
	 */
	protected extractCodeBlocks(content: string): CodeBlockInfo[] {
		const blocks: CodeBlockInfo[] = [];
		const lines = content.split('\n');

		let inCodeBlock = false;
		let blockType = '';
		let blockContent: string[] = [];
		let startLine = 0;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i] ?? '';

			if (line.startsWith('```') && !inCodeBlock) {
				const type = line.slice(3).trim();
				if (type === this.codeBlockType) {
					inCodeBlock = true;
					blockType = type;
					blockContent = [];
					startLine = i;
				}
			} else if (line.startsWith('```') && inCodeBlock) {
				// 코드 블록 종료
				if (blockType === this.codeBlockType) {
					blocks.push({
						content: blockContent.join('\n'),
						startLine,
						endLine: i,
					});
				}
				inCodeBlock = false;
				blockType = '';
				blockContent = [];
			} else if (inCodeBlock) {
				blockContent.push(line);
			}
		}

		return blocks;
	}

	/**
	 * 코드 블록 내용 파싱 (하위 클래스에서 구현)
	 */
	protected abstract parseBlock(content: string): T | null;

	/**
	 * 파싱된 데이터에서 날짜 추출 (하위 클래스에서 구현)
	 */
	protected abstract extractDate(data: T): Date | null;

	/**
	 * 날짜 문자열 파싱
	 */
	protected parseDateString(dateStr: string | undefined): Date | null {
		if (!dateStr) return null;

		// ISO format: 2025-01-18 or 2025-01-18 15:30
		const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}))?/);
		if (isoMatch && isoMatch[1] && isoMatch[2] && isoMatch[3]) {
			const year = parseInt(isoMatch[1], 10);
			const month = parseInt(isoMatch[2], 10) - 1;
			const day = parseInt(isoMatch[3], 10);
			const hour = isoMatch[4] ? parseInt(isoMatch[4], 10) : 0;
			const minute = isoMatch[5] ? parseInt(isoMatch[5], 10) : 0;
			return new Date(year, month, day, hour, minute);
		}

		return null;
	}

	/**
	 * 시간 문자열을 초로 변환 (예: "1h 30m 45s" -> 5445)
	 */
	protected parseDurationToSeconds(duration: string | undefined): number {
		if (!duration) return 0;

		let seconds = 0;

		// 시간
		const hourMatch = duration.match(/(\d+)\s*(?:h|시간)/);
		if (hourMatch && hourMatch[1]) {
			seconds += parseInt(hourMatch[1], 10) * 3600;
		}

		// 분
		const minMatch = duration.match(/(\d+)\s*(?:m|분)/);
		if (minMatch && minMatch[1]) {
			seconds += parseInt(minMatch[1], 10) * 60;
		}

		// 초
		const secMatch = duration.match(/(\d+)\s*(?:s|초)/);
		if (secMatch && secMatch[1]) {
			seconds += parseInt(secMatch[1], 10);
		}

		return seconds;
	}
}
