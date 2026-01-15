# Life Log Plugin - 확장 스펙 문서

> **버전**: 2.0.0
> **작성일**: 2026-01-15
> **저장소**: https://github.com/reallygood83/life-log
> **배포 방식**: Obsidian BRAT

---

## 1. 프로젝트 개요

### 1.1 비전
하나의 Obsidian 플러그인에서 **학습 기록(Study Log)**과 **운동 기록(Workout Log)**을 통합 관리하여, 일상의 자기계발 활동을 체계적으로 추적하고 AI 기반 분석이 가능한 구조화된 데이터를 생성한다.

### 1.2 핵심 목표
1. **통합 모달 인터페이스**: 단일 진입점에서 학습/운동 기록 선택
2. **학습 기록 기능**: 과목별 학습 세션 추적, 타이머, 자가평가
3. **자동 파일 저장**: 날짜별로 지정 폴더에 마크다운 저장
4. **AI 분석 친화적**: 주간/월간/연간 분석을 위한 구조화된 데이터 포맷

### 1.3 기존 기능과의 관계
- 기존 `life-log` 코드블록 → **완전 호환 유지**
- 새로운 `study-log` 코드블록 → **신규 추가**
- 통합 모달 → **새로운 진입점** (Command Palette에서 실행)

---

## 2. 사용자 시나리오

### 2.1 학습 기록 시나리오
```
1. 사용자가 Command Palette에서 "Life Log: 새 기록" 실행
2. 모달 팝업 → "학습 기록" 탭 선택
3. 과목 선택/입력 (예: "수학", "영어", "프로그래밍")
4. 학습 항목 추가 (예: "미적분 Chapter 3", "React Hooks 학습")
5. "시작" 버튼 → 타이머 시작
6. 학습 완료 후 "완료" → 집중도/이해도 자가평가
7. 자동으로 Vault 내 지정 폴더에 날짜별 파일로 저장
```

### 2.2 운동 기록 시나리오
```
1. 모달 팝업 → "운동 기록" 탭 선택
2. 기존 Workout Log 기능과 동일하게 동작
3. 운동 완료 후 지정 폴더에 저장
```

### 2.3 AI 분석 시나리오
```
1. 사용자가 Claude Code에 요청: "이번 주 학습 분석해줘"
2. Claude가 지정 폴더의 .md 파일들을 읽어 분석
3. 과목별 학습 시간, 집중도 트렌드, 추천사항 제공
```

---

## 3. 기능 명세

### 3.1 통합 모달 (Quick Log Modal)

#### 3.1.1 모달 구조
```
┌─────────────────────────────────────────────┐
│  Life Log                              [X]  │
├─────────────────────────────────────────────┤
│  [ 학습 기록 ]  [ 운동 기록 ]               │
├─────────────────────────────────────────────┤
│                                             │
│  (선택된 탭의 컨텐츠)                        │
│                                             │
└─────────────────────────────────────────────┘
```

#### 3.1.2 진입점
- **Command Palette**: "Life Log: 새 기록" (기본 단축키: `Ctrl/Cmd + Shift + L`)
- **Ribbon Icon**: 왼쪽 사이드바 아이콘 클릭
- **기존 방식 유지**: 마크다운에서 직접 코드블록 작성도 가능

---

### 3.2 학습 기록 (Study Log)

#### 3.2.1 학습 기록 데이터 모델

```typescript
interface StudyMetadata {
  title: string              // 학습 세션 제목 (예: "2026-01-15 오후 학습")
  subject: string            // 과목/분야 (예: "수학", "프로그래밍", "영어")
  state: 'planned' | 'started' | 'completed'
  startDate?: string         // 시작 시간
  endDate?: string           // 종료 시간
  totalDuration?: string     // 총 학습 시간
  focusScore?: number        // 집중도 (1-5)
  comprehensionScore?: number // 이해도 (1-5)
  tags?: string[]            // 태그 (예: ["복습", "시험준비"])
}

interface StudyTask {
  state: 'pending' | 'inProgress' | 'completed' | 'skipped'
  name: string               // 학습 항목 (예: "미적분 Chapter 3")
  targetDuration?: number    // 목표 시간 (초)
  recordedDuration?: string  // 실제 소요 시간
  notes?: string             // 간단한 메모
  lineIndex: number
}

interface ParsedStudyLog {
  metadata: StudyMetadata
  tasks: StudyTask[]
  rawLines: string[]
  metadataEndIndex: number
}
```

#### 3.2.2 마크다운 포맷

```markdown
```study-log
title: 2026-01-15 오후 학습
subject: 수학
state: completed
startDate: 2026-01-15 14:00
endDate: 2026-01-15 16:30
totalDuration: 2h 30m
focusScore: 4
comprehensionScore: 4
tags: 복습, 시험준비
---
- [x] 미적분 Chapter 3 복습 | Duration: 45m | 개념 정리 완료
- [x] 연습문제 풀이 | Duration: 1h 15m | 20문제 중 18문제 정답
- [ ] Chapter 4 예습 | Duration: [30m]
```
```

#### 3.2.3 학습 기록 UI 구성

**헤더 영역**:
```
┌─────────────────────────────────────────────┐
│ 📚 수학 학습                    ⏱ 2h 30m   │
│ 집중도: ★★★★☆  이해도: ★★★★☆             │
└─────────────────────────────────────────────┘
```

**학습 항목 목록**:
```
┌─────────────────────────────────────────────┐
│ ✓ 미적분 Chapter 3 복습          45m       │
│   "개념 정리 완료"                          │
├─────────────────────────────────────────────┤
│ ✓ 연습문제 풀이                  1h 15m    │
│   "20문제 중 18문제 정답"                   │
├─────────────────────────────────────────────┤
│ ○ Chapter 4 예습                 [30m] ▼   │
│   [시작] [건너뛰기]                         │
└─────────────────────────────────────────────┘
```

**컨트롤 영역 (학습 중)**:
```
┌─────────────────────────────────────────────┐
│  [⏸ 일시정지]  [⏭ 다음 항목]  [✓ 완료]    │
└─────────────────────────────────────────────┘
```

**완료 후 자가평가 모달**:
```
┌─────────────────────────────────────────────┐
│  학습 완료! 자가평가를 해주세요              │
├─────────────────────────────────────────────┤
│  집중도: ○ ○ ○ ○ ○  (1~5)                  │
│  이해도: ○ ○ ○ ○ ○  (1~5)                  │
│  메모: [____________________________]       │
├─────────────────────────────────────────────┤
│              [저장하고 종료]                │
└─────────────────────────────────────────────┘
```

#### 3.2.4 학습 기록 타이머 모드

| 모드 | 설명 | 표시 |
|------|------|------|
| **목표 시간 설정** | `Duration: [30m]` 형식으로 목표 설정 | 카운트다운 ▼ |
| **자유 시간 측정** | Duration 미설정 시 경과 시간 측정 | 카운트업 ▲ |
| **포모도로 (선택)** | 25분 학습 + 5분 휴식 사이클 | 🍅 아이콘 |

---

### 3.3 과목 관리

#### 3.3.1 기본 과목 프리셋
설정에서 자주 사용하는 과목을 미리 등록:

```typescript
interface SubjectPreset {
  name: string           // 과목명
  icon: string           // 이모지 아이콘
  color: string          // 테마 색상
  defaultTasks?: string[] // 기본 학습 항목 템플릿
}

// 예시
const defaultSubjects: SubjectPreset[] = [
  { name: "수학", icon: "📐", color: "#4A90D9" },
  { name: "영어", icon: "🔤", color: "#7B68EE" },
  { name: "프로그래밍", icon: "💻", color: "#50C878" },
  { name: "독서", icon: "📖", color: "#FFB347" },
  { name: "기타", icon: "📝", color: "#A0A0A0" },
]
```

#### 3.3.2 과목 선택 UI
```
┌─────────────────────────────────────────────┐
│  과목 선택                                   │
├─────────────────────────────────────────────┤
│  [📐 수학]  [🔤 영어]  [💻 프로그래밍]       │
│  [📖 독서]  [📝 기타]  [+ 새 과목]          │
└─────────────────────────────────────────────┘
```

---

### 3.4 파일 저장 시스템

#### 3.4.1 폴더 구조
설정에서 지정한 폴더 경로에 날짜별로 저장:

```
Vault/
└── Life Logs/              ← 설정에서 지정 (기본값)
    ├── 2026/
    │   └── 01/
    │       ├── 2026-01-15-study.md    ← 학습 기록
    │       ├── 2026-01-15-workout.md  ← 운동 기록
    │       └── 2026-01-16-study.md
    └── templates/          ← 사용자 정의 템플릿
```

#### 3.4.2 파일 병합 정책
같은 날짜에 여러 세션 기록 시:
- **옵션 A (기본)**: 같은 파일에 추가 (여러 코드블록)
- **옵션 B**: 세션별 별도 파일 (`2026-01-15-study-1.md`, `-2.md`)

#### 3.4.3 파일 생성 템플릿

**학습 기록 파일**:
```markdown
---
type: study-log
date: 2026-01-15
created: 2026-01-15T14:00:00
---

# 📚 2026-01-15 학습 기록

## 오후 학습 세션

```study-log
title: 오후 학습
subject: 수학
state: completed
...
```

---

## 3.5 설정 (Plugin Settings)

```typescript
interface LifeLogSettings {
  // 저장 경로
  logFolder: string           // 기본: "Life Logs"
  dateFormat: string          // 기본: "YYYY-MM-DD"

  // 학습 기록 설정
  subjects: SubjectPreset[]   // 과목 프리셋
  defaultStudyDuration: number // 기본 목표 시간 (분)
  enablePomodoro: boolean     // 포모도로 모드 활성화
  pomodoroWork: number        // 작업 시간 (기본: 25분)
  pomodoroBreak: number       // 휴식 시간 (기본: 5분)

  // 운동 기록 설정
  defaultRestDuration: number // 기본 휴식 시간 (초)

  // UI 설정
  defaultTab: 'study' | 'workout' // 모달 기본 탭
  showRibbonIcon: boolean     // 리본 아이콘 표시

  // 알림
  enableTimerSound: boolean   // 타이머 완료 알림음
  enableNotifications: boolean // 시스템 알림
}
```

---

## 4. 데이터 구조 (AI 분석용)

### 4.1 분석 친화적 포맷
모든 기록은 YAML 프론트매터와 구조화된 마크다운으로 저장되어 AI가 쉽게 파싱 가능:

```markdown
---
type: study-log
date: 2026-01-15
subject: 수학
totalDuration: 150  # 분 단위
focusScore: 4
comprehensionScore: 4
tags: [복습, 시험준비]
tasks:
  - name: "미적분 Chapter 3 복습"
    duration: 45
    completed: true
  - name: "연습문제 풀이"
    duration: 75
    completed: true
---
```

### 4.2 분석 쿼리 예시

**주간 학습 시간 집계**:
```
Claude에게: "Life Logs 폴더에서 이번 주 학습 기록을 분석해서
과목별 학습 시간과 집중도 트렌드를 알려줘"
```

**월간 리포트 생성**:
```
Claude에게: "1월 학습 기록을 분석해서 월간 리포트를 만들어줘.
과목별 시간 분배, 평균 집중도, 개선점을 포함해줘"
```

### 4.3 분석 지표

| 지표 | 설명 | 계산 방법 |
|------|------|----------|
| 일일 학습 시간 | 하루 총 학습 시간 | `sum(task.duration)` |
| 과목별 비율 | 과목별 학습 시간 비율 | `subject.time / total.time` |
| 평균 집중도 | 기간 내 평균 집중도 | `avg(focusScore)` |
| 학습 연속성 | 연속 학습 일수 | `consecutive days with logs` |
| 목표 달성률 | 목표 시간 대비 실제 | `actual / target * 100` |
| 집중 시간대 | 집중도가 높은 시간대 | `hour with max focusScore` |

---

## 5. 아키텍처 설계

### 5.1 모듈 구조

```
src/
├── main.ts                    # 플러그인 진입점 (확장)
├── types.ts                   # 타입 정의 (확장)
├── modal/                     # 새로운 모달 시스템
│   ├── QuickLogModal.ts       # 메인 모달
│   ├── StudyLogTab.ts         # 학습 기록 탭
│   ├── WorkoutLogTab.ts       # 운동 기록 탭
│   └── SelfEvalModal.ts       # 자가평가 모달
├── parser/
│   ├── index.ts               # 기존 (life-log용)
│   ├── metadata.ts
│   ├── exercise.ts
│   └── study/                 # 새로운 학습 파서
│       ├── index.ts
│       ├── metadata.ts
│       └── task.ts
├── renderer/
│   ├── index.ts               # 기존 (life-log용)
│   ├── header.ts
│   ├── exercise.ts
│   ├── controls.ts
│   └── study/                 # 새로운 학습 렌더러
│       ├── index.ts
│       ├── header.ts
│       ├── task.ts
│       └── controls.ts
├── timer/
│   └── manager.ts             # 기존 (공유)
├── file/
│   ├── updater.ts             # 기존 (확장)
│   └── creator.ts             # 새로운 파일 생성기
├── serializer.ts              # 기존 (확장)
├── study-serializer.ts        # 새로운 학습 직렬화
└── settings.ts                # 새로운 설정 관리
```

### 5.2 핵심 클래스 다이어그램

```
┌─────────────────┐
│   LifeLogPlugin │ ← main.ts (확장)
├─────────────────┤
│ + timerManager  │
│ + settings      │
│ + fileCreator   │
├─────────────────┤
│ + onload()      │───┬──→ registerCodeBlock('life-log')
│                 │   └──→ registerCodeBlock('study-log')
│ + addCommand()  │──────→ QuickLogModal
└─────────────────┘

┌─────────────────┐      ┌─────────────────┐
│ QuickLogModal   │──────│ StudyLogTab     │
├─────────────────┤      ├─────────────────┤
│ + activeTab     │      │ + createSession │
│ + render()      │      │ + addTask       │
└─────────────────┘      │ + startTimer    │
        │                └─────────────────┘
        │
        └────────────────┌─────────────────┐
                         │ WorkoutLogTab   │
                         ├─────────────────┤
                         │ (기존 기능 래핑) │
                         └─────────────────┘
```

### 5.3 데이터 흐름

```
[사용자 입력]
     │
     ▼
┌─────────────┐    ┌─────────────┐
│ QuickLogModal│───▶│ FileCreator │──▶ 새 .md 파일 생성
└─────────────┘    └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │ Code Block  │ ← Obsidian이 렌더링
                   └─────────────┘
                          │
                          ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Parser    │───▶│  Renderer   │◀───│TimerManager │
└─────────────┘    └─────────────┘    └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │ Serializer  │──▶ 파일 업데이트
                   └─────────────┘
```

---

## 6. 구현 단계

### Phase 1: 기반 구조 (1주차)

#### Task 1.1: 프로젝트 재구성
- [ ] 타입 정의 확장 (`types.ts`)
- [ ] 설정 시스템 구현 (`settings.ts`)
- [ ] 설정 탭 UI 구현

#### Task 1.2: 파일 생성 시스템
- [ ] `FileCreator` 클래스 구현
- [ ] 날짜별 폴더 생성 로직
- [ ] 템플릿 기반 파일 생성

#### Task 1.3: 코드블록 등록
- [ ] `study-log` 코드블록 프로세서 등록
- [ ] 기존 `life-log`와의 공존 확인

### Phase 2: 학습 기록 핵심 (2주차)

#### Task 2.1: 학습 파서
- [ ] `parser/study/index.ts` 구현
- [ ] 메타데이터 파서 구현
- [ ] 학습 항목 파서 구현

#### Task 2.2: 학습 렌더러
- [ ] 헤더 렌더러 (과목, 총 시간, 평가)
- [ ] 학습 항목 렌더러 (진행 상태, 타이머)
- [ ] 컨트롤 버튼 렌더러

#### Task 2.3: 학습 직렬화
- [ ] `study-serializer.ts` 구현
- [ ] 상태 업데이트 함수들
- [ ] YAML 프론트매터 생성

### Phase 3: 통합 모달 (3주차)

#### Task 3.1: 모달 프레임워크
- [ ] `QuickLogModal.ts` 기본 구조
- [ ] 탭 전환 로직
- [ ] 스타일링

#### Task 3.2: 학습 기록 탭
- [ ] 과목 선택 UI
- [ ] 학습 항목 추가 UI
- [ ] 시작 버튼 연동

#### Task 3.3: 운동 기록 탭
- [ ] 기존 워크아웃 기능 래핑
- [ ] 모달 내 렌더링 적용

#### Task 3.4: 자가평가 모달
- [ ] `SelfEvalModal.ts` 구현
- [ ] 집중도/이해도 입력 UI
- [ ] 메모 입력 필드

### Phase 4: 고급 기능 (4주차)

#### Task 4.1: 타이머 기능 확장
- [ ] 포모도로 모드 구현
- [ ] 알림음 지원
- [ ] 시스템 알림 지원

#### Task 4.2: 통계 대시보드 (선택)
- [ ] 일간/주간 요약 뷰
- [ ] 차트 렌더링 (선택)

#### Task 4.3: 최종 테스트 및 문서화
- [ ] 전체 기능 테스트
- [ ] README.md 업데이트
- [ ] BRAT 배포 준비

---

## 7. UI/UX 가이드라인

### 7.1 디자인 원칙

1. **심플함 우선**: 필수 기능만 노출, 고급 기능은 설정에서 활성화
2. **일관성**: 운동 기록과 학습 기록의 UI 패턴 통일
3. **피드백**: 모든 액션에 즉각적인 시각적 피드백
4. **접근성**: 키보드 네비게이션 지원, 적절한 색상 대비

### 7.2 색상 체계

```css
/* 학습 기록 색상 */
--study-primary: #4A90D9;      /* 메인 강조색 */
--study-success: #50C878;      /* 완료 상태 */
--study-warning: #FFB347;      /* 경고/초과 */
--study-muted: #A0A0A0;        /* 비활성 */

/* 평가 색상 */
--score-1: #FF6B6B;            /* 1점: 빨강 */
--score-2: #FFA07A;            /* 2점: 연주황 */
--score-3: #FFD93D;            /* 3점: 노랑 */
--score-4: #90EE90;            /* 4점: 연두 */
--score-5: #50C878;            /* 5점: 초록 */
```

### 7.3 반응형 디자인

- **데스크톱**: 가로 배치, 넉넉한 여백
- **모바일**: 세로 스택, 큰 터치 타겟 (44px 이상)
- **모달**: 최대 너비 600px, 중앙 정렬

---

## 8. 테스트 계획

### 8.1 단위 테스트
- [ ] 파서 테스트: 다양한 마크다운 포맷 파싱
- [ ] 직렬화 테스트: 파싱 → 직렬화 왕복 검증
- [ ] 타이머 테스트: 시간 계산 정확성

### 8.2 통합 테스트
- [ ] 모달 → 파일 생성 → 코드블록 렌더링 흐름
- [ ] 다중 세션 동시 기록
- [ ] 파일 충돌 처리

### 8.3 사용자 테스트
- [ ] 실제 학습 세션으로 1주일 테스트
- [ ] AI 분석 파이프라인 검증
- [ ] 엣지 케이스 수집

---

## 9. 배포 계획

### 9.1 버전 관리

| 버전 | 내용 | 상태 |
|------|------|------|
| 1.x | 기존 Workout Log | 완료 |
| 2.0.0-beta.1 | Study Log 기본 기능 | 개발 예정 |
| 2.0.0-beta.2 | 통합 모달 | 개발 예정 |
| 2.0.0 | 정식 릴리즈 | 목표 |

### 9.2 BRAT 배포

```json
// manifest.json 업데이트
{
  "id": "life-log",
  "name": "Life Log",
  "version": "2.0.0",
  "description": "Track your study sessions and workouts with timers and AI-friendly data export",
  "author": "reallygood83",
  "authorUrl": "https://github.com/reallygood83",
  "isDesktopOnly": false
}
```

### 9.3 릴리즈 체크리스트

- [ ] `manifest.json` 버전 업데이트
- [ ] `versions.json` 업데이트
- [ ] CHANGELOG.md 작성
- [ ] GitHub Release 생성
- [ ] BRAT 테스트 설치 검증

---

## 10. 향후 확장 가능성

### 10.1 추가 기능 후보
- **복습 알림**: 에빙하우스 망각곡선 기반 복습 일정
- **목표 설정**: 주간/월간 학습 목표 및 달성률
- **데이터 내보내기**: CSV, JSON 내보내기
- **그래프 시각화**: 학습 통계 차트
- **동기화**: 다른 기기와 데이터 동기화

### 10.2 다른 로그 타입 확장
- `habit-log`: 습관 트래커
- `reading-log`: 독서 기록
- `journal-log`: 일기/감정 기록

---

## 부록 A: 마크다운 포맷 상세

### A.1 Study Log 전체 예시

```markdown
---
type: study-log
date: 2026-01-15
---

# 📚 2026-01-15 학습 기록

## 오전 세션

```study-log
title: 오전 학습
subject: 프로그래밍
state: completed
startDate: 2026-01-15 09:00
endDate: 2026-01-15 11:30
totalDuration: 2h 30m
focusScore: 5
comprehensionScore: 4
tags: TypeScript, Obsidian
---
- [x] Obsidian Plugin API 학습 | Duration: 1h | 공식 문서 정독
- [x] 타입 시스템 복습 | Duration: 45m | 제네릭 패턴 학습
- [x] 실습 프로젝트 | Duration: 45m | Modal 구현 연습
```

## 오후 세션

```study-log
title: 오후 학습
subject: 수학
state: completed
startDate: 2026-01-15 14:00
endDate: 2026-01-15 15:30
totalDuration: 1h 30m
focusScore: 3
comprehensionScore: 4
tags: 미적분, 복습
---
- [x] 미적분 Chapter 5 | Duration: 1h | 적분 기초
- [x] 연습문제 | Duration: 30m | 10문제 풀이
```
```

### A.2 Workout Log 기존 포맷 (호환 유지)

```markdown
```life-log
title: 아침 운동
state: completed
startDate: 2026-01-15 07:00
duration: 45m 30s
restDuration: 60s
---
- [x] 스쿼트 | Weight: 60kg | Sets: 3 | Reps: 10 | Duration: 5m
- [x] 벤치프레스 | Weight: 50kg | Sets: 3 | Reps: 8 | Duration: 6m
- [x] 런닝 | Distance: 3km | Duration: 20m
```
```

---

## 부록 B: 설정 UI 목업

```
┌─────────────────────────────────────────────────────┐
│  Life Log Settings                                  │
├─────────────────────────────────────────────────────┤
│  📁 저장 설정                                       │
│  ─────────────────────────────────                  │
│  기록 저장 폴더: [Life Logs        ] [📂 선택]     │
│  날짜 형식:      [YYYY-MM-DD       ▼]              │
│  파일 병합:      (●) 같은 날짜는 하나의 파일       │
│                  ( ) 세션별 별도 파일               │
│                                                     │
│  📚 학습 기록 설정                                  │
│  ─────────────────────────────────                  │
│  과목 관리:      [📐수학] [🔤영어] [💻프로그래밍]  │
│                  [+ 과목 추가]                      │
│  기본 목표 시간: [30] 분                            │
│  포모도로 모드:  [✓] 활성화                        │
│    작업 시간:    [25] 분                            │
│    휴식 시간:    [5] 분                             │
│                                                     │
│  🏋️ 운동 기록 설정                                  │
│  ─────────────────────────────────                  │
│  기본 휴식 시간: [60] 초                            │
│                                                     │
│  🔔 알림 설정                                       │
│  ─────────────────────────────────                  │
│  타이머 완료음:  [✓] 활성화                        │
│  시스템 알림:    [ ] 활성화                         │
│                                                     │
│  🎨 UI 설정                                         │
│  ─────────────────────────────────                  │
│  기본 탭:        (●) 학습 기록  ( ) 운동 기록       │
│  리본 아이콘:    [✓] 표시                          │
└─────────────────────────────────────────────────────┘
```

---

**문서 끝**
