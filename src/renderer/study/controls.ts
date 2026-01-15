import { StudyState, StudyLogCallbacks, ParsedStudyLog } from '../../types';
import { initAudioContext } from '../../utils/audio';

export function renderStudyControls(
	container: HTMLElement,
	state: StudyState,
	callbacks: StudyLogCallbacks,
	parsed: ParsedStudyLog
): HTMLElement {
	const controlsEl = container.createDiv({ cls: 'study-controls' });

	if (state === 'planned') {
		const startBtn = controlsEl.createEl('button', {
			cls: 'study-btn study-btn-primary study-btn-large'
		});
		startBtn.createSpan({ cls: 'study-btn-icon', text: '▶' });
		startBtn.createSpan({ text: '학습 시작' });
		startBtn.addEventListener('click', () => {
			initAudioContext();
			callbacks.onStartStudy();
		});
	} else if (state === 'started') {
		const finishBtn = controlsEl.createEl('button', {
			cls: 'study-btn study-btn-primary'
		});
		finishBtn.createSpan({ cls: 'study-btn-icon', text: '✓' });
		finishBtn.createSpan({ text: '학습 완료' });
		finishBtn.addEventListener('click', () => callbacks.onOpenSelfEval());
	} else if (state === 'completed') {
		const completedLabel = controlsEl.createSpan({ cls: 'study-completed-label' });
		completedLabel.createSpan({ cls: 'study-btn-icon', text: '✓' });
		completedLabel.createSpan({ text: '완료됨' });

		const copyBtn = controlsEl.createEl('button', { cls: 'study-btn' });
		copyBtn.createSpan({ cls: 'study-btn-icon', text: '📋' });
		copyBtn.createSpan({ text: '템플릿 복사' });
		copyBtn.addEventListener('click', async () => {
			const template = createStudyTemplate(parsed);
			await navigator.clipboard.writeText('```study-log\n' + template + '\n```');

			const textSpan = copyBtn.querySelector('span:last-child');
			if (textSpan) {
				const originalText = textSpan.textContent;
				textSpan.textContent = 'Copied!';
				setTimeout(() => {
					textSpan.textContent = originalText;
				}, 1500);
			}
		});
	}

	return controlsEl;
}

function createStudyTemplate(parsed: ParsedStudyLog): string {
	const lines: string[] = [];

	if (parsed.metadata.subject) {
		lines.push(`subject: ${parsed.metadata.subject}`);
	}
	lines.push('state: planned');
	lines.push('---');

	const seenNames = new Set<string>();
	for (const task of parsed.tasks) {
		if (!seenNames.has(task.name)) {
			seenNames.add(task.name);
			let line = `- [ ] ${task.name}`;
			if (task.targetDuration) {
				const mins = Math.floor(task.targetDuration / 60);
				const secs = task.targetDuration % 60;
				line += ` | Duration: [${mins}m${secs > 0 ? ' ' + secs + 's' : ''}]`;
			}
			lines.push(line);
		}
	}

	return lines.join('\n');
}
