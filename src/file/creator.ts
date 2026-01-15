import { App, TFile, TFolder, normalizePath } from 'obsidian';
import { LifeLogSettings } from '../types';

export type LogType = 'study' | 'workout';

export class FileCreator {
	constructor(
		private app: App,
		private settings: LifeLogSettings
	) {}

	async createLogFile(type: LogType, codeBlockContent: string): Promise<TFile> {
		const date = new Date();
		const folderPath = this.buildFolderPath(date);
		const fileName = this.buildFileName(date, type);
		const filePath = normalizePath(`${folderPath}/${fileName}`);

		await this.ensureFolderExists(folderPath);

		const existingFile = this.app.vault.getAbstractFileByPath(filePath);
		
		if (existingFile instanceof TFile) {
			return this.appendToExistingFile(existingFile, type, codeBlockContent);
		}
		
		return this.createNewFile(filePath, type, date, codeBlockContent);
	}

	private buildFolderPath(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		return normalizePath(`${this.settings.logFolder}/${year}/${month}`);
	}

	private buildFileName(date: Date, type: LogType): string {
		const dateStr = this.formatDate(date);
		return `${dateStr}-${type}.md`;
	}

	private formatDate(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');

		switch (this.settings.dateFormat) {
			case 'YYYY/MM/DD':
				return `${year}/${month}/${day}`;
			case 'DD-MM-YYYY':
				return `${day}-${month}-${year}`;
			default:
				return `${year}-${month}-${day}`;
		}
	}

	private async ensureFolderExists(folderPath: string): Promise<void> {
		const folder = this.app.vault.getAbstractFileByPath(folderPath);
		if (folder instanceof TFolder) return;

		const parts = folderPath.split('/');
		let currentPath = '';

		for (const part of parts) {
			currentPath = currentPath ? `${currentPath}/${part}` : part;
			const existing = this.app.vault.getAbstractFileByPath(currentPath);
			
			if (!existing) {
				await this.app.vault.createFolder(currentPath);
			}
		}
	}

	private async appendToExistingFile(
		file: TFile,
		type: LogType,
		codeBlockContent: string
	): Promise<TFile> {
		const blockType = type === 'study' ? 'study-log' : 'life-log';
		const newSection = this.buildNewSection(type, codeBlockContent, blockType);

		await this.app.vault.process(file, (content) => {
			return content + '\n\n---\n\n' + newSection;
		});

		return file;
	}

	private async createNewFile(
		filePath: string,
		type: LogType,
		date: Date,
		codeBlockContent: string
	): Promise<TFile> {
		const blockType = type === 'study' ? 'study-log' : 'life-log';
		const frontmatter = this.buildFrontmatter(type, date);
		const heading = this.buildHeading(type, date);
		const section = this.buildNewSection(type, codeBlockContent, blockType);

		const content = `${frontmatter}\n\n${heading}\n\n${section}`;

		return await this.app.vault.create(filePath, content);
	}

	private buildFrontmatter(type: LogType, date: Date): string {
		const dateStr = this.formatDate(date);
		const now = date.toISOString();

		return [
			'---',
			`type: ${type}-log`,
			`date: ${dateStr}`,
			`created: ${now}`,
			'---'
		].join('\n');
	}

	private buildHeading(type: LogType, date: Date): string {
		const dateStr = this.formatDate(date);
		const emoji = type === 'study' ? '📚' : '🏋️';
		const label = type === 'study' ? '학습' : '운동';
		return `# ${emoji} ${dateStr} ${label} 기록`;
	}

	private buildNewSection(type: LogType, codeBlockContent: string, blockType: string): string {
		const now = new Date();
		const hours = now.getHours();
		const period = hours < 12 ? '오전' : (hours < 18 ? '오후' : '저녁');
		const label = type === 'study' ? '학습' : '운동';

		return [
			`## ${period} ${label} 세션`,
			'',
			`\`\`\`${blockType}`,
			codeBlockContent,
			'```'
		].join('\n');
	}

	formatDateTime(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		return `${year}-${month}-${day} ${hours}:${minutes}`;
	}
}
