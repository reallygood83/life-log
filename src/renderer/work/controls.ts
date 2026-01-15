import { WorkState, WorkLogCallbacks, ParsedWorkLog } from '../../types';
import { initAudioContext } from '../../utils/audio';

export function renderWorkControls(
	container: HTMLElement,
	state: WorkState,
	callbacks: WorkLogCallbacks,
	parsed: ParsedWorkLog
): HTMLElement {
	const controlsEl = container.createDiv({ cls: 'work-controls' });

	if (state === 'planned') {
		const startBtn = controlsEl.createEl('button', {
			cls: 'work-btn work-btn-primary work-btn-large'
		});
		startBtn.createSpan({ cls: 'work-btn-icon', text: '▶' });
		startBtn.createSpan({ text: '업무 시작' });
		startBtn.addEventListener('click', async () => {
			console.log('[Life Log] Work start button clicked');
			initAudioContext();
			try {
				await callbacks.onStartWork();
				console.log('[Life Log] onStartWork completed');
			} catch (e) {
				console.error('[Life Log] onStartWork error:', e);
			}
		});
	} else if (state === 'started') {
		const finishBtn = controlsEl.createEl('button', {
			cls: 'work-btn work-btn-primary'
		});
		finishBtn.createSpan({ cls: 'work-btn-icon', text: '✓' });
		finishBtn.createSpan({ text: '업무 완료' });
		finishBtn.addEventListener('click', () => callbacks.onFinishWork());
	} else if (state === 'completed') {
		const completedLabel = controlsEl.createSpan({ cls: 'work-completed-label' });
		completedLabel.createSpan({ cls: 'work-btn-icon', text: '✓' });
		completedLabel.createSpan({ text: '완료됨' });

		renderCompletedStats(controlsEl, parsed);

		const copyBtn = controlsEl.createEl('button', { cls: 'work-btn' });
		copyBtn.createSpan({ cls: 'work-btn-icon', text: '📋' });
		copyBtn.createSpan({ text: '템플릿 복사' });
		copyBtn.addEventListener('click', async () => {
			const template = createWorkTemplate(parsed);
			await navigator.clipboard.writeText('```work-log\n' + template + '\n```');

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

function renderCompletedStats(container: HTMLElement, parsed: ParsedWorkLog): void {
	const statsEl = container.createDiv({ cls: 'work-stats' });
	
	const completedCount = parsed.tasks.filter(t => t.state === 'completed').length;
	const totalCount = parsed.tasks.length;
	
	statsEl.createSpan({ 
		cls: 'work-stat',
		text: `완료: ${completedCount}/${totalCount}`
	});
	
	const highPriorityCompleted = parsed.tasks.filter(
		t => t.priority === 'high' && t.state === 'completed'
	).length;
	const highPriorityTotal = parsed.tasks.filter(t => t.priority === 'high').length;
	
	if (highPriorityTotal > 0) {
		const statEl = statsEl.createSpan({ cls: 'work-stat high-priority' });
		statEl.createSpan({ cls: 'priority-dot high' });
		statEl.createSpan({ text: ` 중요: ${highPriorityCompleted}/${highPriorityTotal}` });
	}
}

function createWorkTemplate(parsed: ParsedWorkLog): string {
	const lines: string[] = [];

	lines.push('state: planned');
	lines.push('---');

	const seenNames = new Set<string>();
	for (const task of parsed.tasks) {
		if (!seenNames.has(task.name)) {
			seenNames.add(task.name);
			let line = `- [ ] ${task.name} | Priority: ${task.priority}`;
			if (task.expectedDuration) {
				line += ` | Expected: [${formatDurationHuman(task.expectedDuration)}]`;
			}
			lines.push(line);
		}
	}

	return lines.join('\n');
}

function formatDurationHuman(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const mins = Math.floor((seconds % 3600) / 60);
	
	if (hours > 0) {
		if (mins === 0) return `${hours}h`;
		return `${hours}h ${mins}m`;
	}
	return `${mins}m`;
}
