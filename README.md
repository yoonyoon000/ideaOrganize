# 아이디어 마인드맵

React + TypeScript + React Flow + Zustand + Express 기반의 한국어 브레인스토밍 마인드맵 앱입니다. 처음에는 중심 아이디어 하나와 관련 단어 5개로 시작하고, 이후 `자유형 보기`, `구조형 보기`, `AI 묶어보기`를 각각 별도 화면처럼 전환해서 볼 수 있습니다. AI는 겹치는 단어와 유사한 아이디어를 묶는 기능에만 사용합니다.

## 프로젝트 구조

```text
.
├─ server/
│  └─ index.ts
├─ src/
│  ├─ api/
│  │  └─ groups.ts
│  ├─ components/
│  │  ├─ GroupingPanel.tsx
│  │  ├─ Header.tsx
│  │  ├─ MindMapNodeCard.tsx
│  │  └─ OnboardingModal.tsx
│  ├─ lib/
│  │  ├─ download.ts
│  │  ├─ layout.ts
│  │  ├─ spreadLayout.ts
│  │  └─ storage.ts
│  ├─ store/
│  │  └─ useMindMapStore.ts
│  ├─ App.tsx
│  ├─ main.tsx
│  ├─ styles.css
│  └─ types.ts
├─ .env.example
├─ index.html
├─ package.json
├─ tsconfig.json
├─ tsconfig.node.json
├─ tsconfig.server.json
└─ vite.config.ts
```

## 주요 기능

- 첫 진입 시 중심 아이디어 입력
- 두 번째 단계에서 관련 단어 5개 입력
- 자유롭게 뻗어가는 `자유형 보기`
- 정리된 계층 구조의 `구조형 보기`
- AI 묶기 결과만 따로 보는 `AI 묶어보기`
- 노드 클릭 시 툴바 노출
- 하위 아이디어 수동 추가, 텍스트 수정, 삭제
- AI 기반 반복/유사 단어 묶기
- 브랜치 접기/펼치기
- 로컬 스토리지 자동 저장
- PNG 이미지 저장

## 실행 방법

1. 의존성 설치

```bash
npm install
```

2. 환경 변수 설정

```bash
cp .env.example .env
```

`.env`에 OpenAI 키를 넣으면 비슷한 단어/아이디어 묶기 기능이 실제 API를 사용합니다. 키가 없으면 앱은 같은 텍스트를 기준으로 기본 묶기를 수행합니다.

3. 개발 서버 실행

```bash
npm run dev
```

- 프론트엔드: `http://localhost:5173`
- API 서버: `http://localhost:8787`

## AI 묶기 로직

`POST /api/group-ideas`

입력:

```json
{
  "ideas": [
    {
      "id": "node-id",
      "text": "사용자 인터뷰",
      "parentText": "리서치"
    }
  ]
}
```

출력:

```json
{
  "groups": [
    {
      "id": "group-1",
      "label": "사용자 리서치",
      "nodeIds": ["a", "b"],
      "reason": "비슷한 맥락의 조사 활동"
    }
  ]
}
```

## 기술 선택

- React + TypeScript: UI 구현
- React Flow: 마인드맵 캔버스와 연결선
- Zustand: 노드 상태 관리
- Dagre + 커스텀 방사형 배치: 구조형/자유형 뷰
- Express + OpenAI SDK: AI 그룹 묶기 API
