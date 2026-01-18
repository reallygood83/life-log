import { AnalysisTemplate, LogCategory } from '../../types';

/**
 * 학습 분석 기본 템플릿
 */
export const STUDY_TEMPLATES: AnalysisTemplate[] = [
	{
		id: 'study-weekly',
		name: '주간 학습 리포트',
		category: 'study',
		description: '일주일간의 학습 패턴과 성과를 분석합니다.',
		isBuiltIn: true,
		isEnabled: true,
		systemPrompt: `당신은 학습 효율 분석 전문가입니다. 학생의 학습 기록을 분석하여 효과적인 학습 전략을 제안합니다.
분석 시 다음을 고려하세요:
- 과목별 학습 시간 분포
- 집중력과 효율성 패턴
- 강점과 개선이 필요한 영역
- 구체적이고 실행 가능한 조언`,
		userPromptTemplate: `다음 학습 기록을 분석하여 주간 학습 리포트를 작성해주세요.

[분석 기간]
{{period}}

[학습 데이터]
{{rawData}}

[요청사항]
1. 학습 시간 요약 (총 시간, 일평균, 과목별)
2. 학습 패턴 분석 (시간대별 집중도, 효율적인 학습 시간)
3. 과목별 심층 분석
4. 강점 및 개선점
5. 다음 주 추천 학습 계획

Markdown 형식으로 한국어로 작성해주세요.`,
		dataRange: 'week',
		outputFormat: 'markdown',
		outputSections: ['요약', '학습 시간 분석', '과목별 분석', '강점', '개선점', '추천 계획'],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		usageCount: 0,
	},
	{
		id: 'study-monthly',
		name: '월간 학습 리포트',
		category: 'study',
		description: '한 달간의 학습 성과와 성장을 분석합니다.',
		isBuiltIn: true,
		isEnabled: true,
		systemPrompt: `당신은 학습 분석 전문가입니다. 월간 학습 데이터를 분석하여 장기적인 성장 트렌드와 목표 달성률을 평가합니다.`,
		userPromptTemplate: `다음 학습 기록을 분석하여 월간 학습 리포트를 작성해주세요.

[분석 기간]
{{period}}

[학습 데이터]
{{rawData}}

[요청사항]
1. 월간 학습 요약 (총 시간, 주별 추이)
2. 목표 달성률 분석
3. 주별 트렌드 변화
4. 과목별 성장 분석
5. 다음 달 목표 제안

Markdown 형식으로 한국어로 작성해주세요.`,
		dataRange: 'month',
		outputFormat: 'markdown',
		outputSections: ['월간 요약', '목표 달성률', '트렌드 분석', '성장 분석', '다음 달 목표'],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		usageCount: 0,
	},
	{
		id: 'study-subject',
		name: '과목별 심층 분석',
		category: 'study',
		description: '특정 과목의 학습 패턴과 효율성을 분석합니다.',
		isBuiltIn: true,
		isEnabled: true,
		systemPrompt: `당신은 과목별 학습 분석 전문가입니다. 특정 과목에 대한 깊이 있는 분석과 맞춤형 학습 전략을 제공합니다.`,
		userPromptTemplate: `다음 학습 기록을 분석하여 과목별 심층 분석 리포트를 작성해주세요.

[분석 기간]
{{period}}

[학습 데이터]
{{rawData}}

[요청사항]
1. 과목별 학습 시간 및 빈도
2. 각 과목의 학습 효율성 평가
3. 과목 간 균형 분석
4. 취약 과목 식별 및 개선 방안
5. 과목별 맞춤 학습 전략

Markdown 형식으로 한국어로 작성해주세요.`,
		dataRange: 'month',
		outputFormat: 'markdown',
		outputSections: ['과목별 요약', '효율성 분석', '균형 분석', '개선 방안', '맞춤 전략'],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		usageCount: 0,
	},
];

/**
 * 운동 분석 기본 템플릿
 */
export const WORKOUT_TEMPLATES: AnalysisTemplate[] = [
	{
		id: 'workout-weekly',
		name: '주간 운동 리포트',
		category: 'workout',
		description: '일주일간의 운동 기록을 분석합니다.',
		isBuiltIn: true,
		isEnabled: true,
		systemPrompt: `당신은 피트니스 분석 전문가입니다. 운동 기록을 분석하여 효과적인 트레이닝 전략을 제안합니다.`,
		userPromptTemplate: `다음 운동 기록을 분석하여 주간 운동 리포트를 작성해주세요.

[분석 기간]
{{period}}

[운동 데이터]
{{rawData}}

[요청사항]
1. 주간 운동 요약 (총 운동 시간, 횟수)
2. 운동 유형별 분석
3. 운동 강도 및 볼륨 분석
4. 휴식 패턴 평가
5. 다음 주 운동 추천

Markdown 형식으로 한국어로 작성해주세요.`,
		dataRange: 'week',
		outputFormat: 'markdown',
		outputSections: ['주간 요약', '운동 분석', '강도 분석', '휴식 분석', '추천 계획'],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		usageCount: 0,
	},
	{
		id: 'workout-progress',
		name: '진척도 분석',
		category: 'workout',
		description: '운동 진행 상황과 성과를 분석합니다.',
		isBuiltIn: true,
		isEnabled: true,
		systemPrompt: `당신은 운동 성과 분석 전문가입니다. 운동 기록의 진척도를 분석하여 성장 트렌드와 개선점을 제시합니다.`,
		userPromptTemplate: `다음 운동 기록을 분석하여 진척도 리포트를 작성해주세요.

[분석 기간]
{{period}}

[운동 데이터]
{{rawData}}

[요청사항]
1. 전반적인 진척도 평가
2. 운동별 성과 변화 추이
3. 개인 기록 달성 현황
4. 근육 그룹별 발달 상태
5. 향후 목표 및 조언

Markdown 형식으로 한국어로 작성해주세요.`,
		dataRange: 'month',
		outputFormat: 'markdown',
		outputSections: ['진척도 요약', '성과 추이', '기록 현황', '발달 분석', '목표 제안'],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		usageCount: 0,
	},
	{
		id: 'workout-balance',
		name: '운동 밸런스 분석',
		category: 'workout',
		description: '근육 그룹별 운동 균형을 분석합니다.',
		isBuiltIn: true,
		isEnabled: true,
		systemPrompt: `당신은 운동 균형 분석 전문가입니다. 근육 그룹별 운동 분포를 분석하여 균형 잡힌 트레이닝을 제안합니다.`,
		userPromptTemplate: `다음 운동 기록을 분석하여 운동 밸런스 리포트를 작성해주세요.

[분석 기간]
{{period}}

[운동 데이터]
{{rawData}}

[요청사항]
1. 전체 운동 분포 요약
2. 근육 그룹별 훈련 비율
3. 불균형 감지 및 분석
4. 과훈련/미훈련 영역 식별
5. 균형 개선 제안

Markdown 형식으로 한국어로 작성해주세요.`,
		dataRange: 'month',
		outputFormat: 'markdown',
		outputSections: ['분포 요약', '그룹별 분석', '불균형 감지', '위험 영역', '개선 제안'],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		usageCount: 0,
	},
];

/**
 * 업무 분석 기본 템플릿
 */
export const WORK_TEMPLATES: AnalysisTemplate[] = [
	{
		id: 'work-weekly',
		name: '주간 업무 리포트',
		category: 'work',
		description: '일주일간의 업무 현황을 분석합니다.',
		isBuiltIn: true,
		isEnabled: true,
		systemPrompt: `당신은 업무 생산성 분석 전문가입니다. 업무 기록을 분석하여 효율적인 시간 관리와 생산성 향상 전략을 제안합니다.`,
		userPromptTemplate: `다음 업무 기록을 분석하여 주간 업무 리포트를 작성해주세요.

[분석 기간]
{{period}}

[업무 데이터]
{{rawData}}

[요청사항]
1. 주간 업무 요약 (총 업무 시간, 완료 태스크 수)
2. 업무 카테고리별 시간 분배
3. 생산성 패턴 분석
4. 예상 대비 실제 소요 시간 비교
5. 다음 주 업무 개선 제안

Markdown 형식으로 한국어로 작성해주세요.`,
		dataRange: 'week',
		outputFormat: 'markdown',
		outputSections: ['주간 요약', '카테고리 분석', '생산성 분석', '시간 비교', '개선 제안'],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		usageCount: 0,
	},
	{
		id: 'work-productivity',
		name: '생산성 분석',
		category: 'work',
		description: '업무 생산성과 효율을 분석합니다.',
		isBuiltIn: true,
		isEnabled: true,
		systemPrompt: `당신은 업무 효율 전문가입니다. 업무 패턴을 분석하여 생산성 최적화 방안을 제시합니다.`,
		userPromptTemplate: `다음 업무 기록을 분석하여 생산성 분석 리포트를 작성해주세요.

[분석 기간]
{{period}}

[업무 데이터]
{{rawData}}

[요청사항]
1. 전반적인 생산성 점수
2. 시간대별 생산성 패턴
3. 업무 완료율 및 지연 분석
4. 집중 업무 시간 분석
5. 생산성 향상 전략

Markdown 형식으로 한국어로 작성해주세요.`,
		dataRange: 'week',
		outputFormat: 'markdown',
		outputSections: ['생산성 점수', '시간대 분석', '완료율 분석', '집중 시간', '향상 전략'],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		usageCount: 0,
	},
	{
		id: 'work-burnout',
		name: '번아웃 위험 분석',
		category: 'work',
		description: '과로 패턴과 번아웃 위험을 분석합니다.',
		isBuiltIn: true,
		isEnabled: true,
		systemPrompt: `당신은 워라밸 전문 상담사입니다. 업무 패턴을 분석하여 번아웃 위험을 평가하고 건강한 업무 방식을 제안합니다.`,
		userPromptTemplate: `다음 업무 기록을 분석하여 번아웃 위험 분석 리포트를 작성해주세요.

[분석 기간]
{{period}}

[업무 데이터]
{{rawData}}

[요청사항]
1. 번아웃 위험도 평가 (낮음/보통/높음)
2. 야근 및 초과 근무 패턴
3. 휴식 및 회복 시간 분석
4. 스트레스 요인 식별
5. 워라밸 개선 제안

Markdown 형식으로 한국어로 작성해주세요.`,
		dataRange: 'week',
		outputFormat: 'markdown',
		outputSections: ['위험도 평가', '초과 근무 분석', '휴식 분석', '스트레스 요인', '개선 제안'],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		usageCount: 0,
	},
];

/**
 * 식단 분석 기본 템플릿
 */
export const MEAL_TEMPLATES: AnalysisTemplate[] = [
	{
		id: 'meal-weekly',
		name: '주간 식단 리포트',
		category: 'meal',
		description: '일주일간의 식사 패턴을 분석합니다.',
		isBuiltIn: true,
		isEnabled: true,
		systemPrompt: `당신은 영양 및 식습관 분석 전문가입니다. 식사 기록을 분석하여 건강한 식습관 형성을 돕습니다.`,
		userPromptTemplate: `다음 식사 기록을 분석하여 주간 식단 리포트를 작성해주세요.

[분석 기간]
{{period}}

[식사 데이터]
{{rawData}}

[요청사항]
1. 주간 식사 요약 (끼니별 식사 횟수)
2. 식사 규칙성 분석
3. 음식 다양성 평가
4. 식사 시간대 패턴
5. 개선 제안

Markdown 형식으로 한국어로 작성해주세요.`,
		dataRange: 'week',
		outputFormat: 'markdown',
		outputSections: ['주간 요약', '규칙성 분석', '다양성 분석', '시간대 분석', '개선 제안'],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		usageCount: 0,
	},
	{
		id: 'meal-pattern',
		name: '식사 패턴 분석',
		category: 'meal',
		description: '식사 시간과 규칙성을 분석합니다.',
		isBuiltIn: true,
		isEnabled: true,
		systemPrompt: `당신은 식습관 패턴 분석 전문가입니다. 식사 시간과 규칙성을 분석하여 건강한 식사 습관을 제안합니다.`,
		userPromptTemplate: `다음 식사 기록을 분석하여 식사 패턴 분석 리포트를 작성해주세요.

[분석 기간]
{{period}}

[식사 데이터]
{{rawData}}

[요청사항]
1. 식사 규칙성 점수
2. 끼니별 식사 시간 분석
3. 결식 패턴 분석
4. 식사 간격 분석
5. 규칙적인 식사를 위한 조언

Markdown 형식으로 한국어로 작성해주세요.`,
		dataRange: 'week',
		outputFormat: 'markdown',
		outputSections: ['규칙성 점수', '시간 분석', '결식 분석', '간격 분석', '개선 조언'],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		usageCount: 0,
	},
	{
		id: 'meal-nutrition',
		name: '영양 밸런스 분석',
		category: 'meal',
		description: '음식 다양성과 영양 균형을 분석합니다.',
		isBuiltIn: true,
		isEnabled: true,
		systemPrompt: `당신은 영양 분석 전문가입니다. 식사 기록에서 영양 균형과 다양성을 분석하여 건강한 식단을 제안합니다.`,
		userPromptTemplate: `다음 식사 기록을 분석하여 영양 밸런스 분석 리포트를 작성해주세요.

[분석 기간]
{{period}}

[식사 데이터]
{{rawData}}

[요청사항]
1. 음식 다양성 점수
2. 자주 먹는 음식 TOP 10
3. 영양소 균형 추정 (탄수화물, 단백질, 채소 등)
4. 부족할 수 있는 영양 요소
5. 식단 개선 제안

Markdown 형식으로 한국어로 작성해주세요.`,
		dataRange: 'month',
		outputFormat: 'markdown',
		outputSections: ['다양성 점수', '빈도 분석', '영양 균형', '부족 영양소', '개선 제안'],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		usageCount: 0,
	},
];

/**
 * 모든 기본 템플릿
 */
export const DEFAULT_TEMPLATES: AnalysisTemplate[] = [
	...STUDY_TEMPLATES,
	...WORKOUT_TEMPLATES,
	...WORK_TEMPLATES,
	...MEAL_TEMPLATES,
];

/**
 * 카테고리별 템플릿 반환
 */
export function getTemplatesByCategory(category: LogCategory): AnalysisTemplate[] {
	switch (category) {
		case 'study':
			return STUDY_TEMPLATES;
		case 'workout':
			return WORKOUT_TEMPLATES;
		case 'work':
			return WORK_TEMPLATES;
		case 'meal':
			return MEAL_TEMPLATES;
		default:
			return [];
	}
}

/**
 * ID로 템플릿 찾기
 */
export function getTemplateById(id: string): AnalysisTemplate | undefined {
	return DEFAULT_TEMPLATES.find(t => t.id === id);
}
