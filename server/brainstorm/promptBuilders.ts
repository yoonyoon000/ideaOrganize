type AiActionType = 'expand' | 'opposite' | 'extreme' | 'combine';

export type BrainstormPromptInput = {
  currentNodeTitle: string;
  parentNodeTitle?: string;
  siblingNodeTitles: string[];
  childNodeTitles: string[];
  actionType: AiActionType;
  userGoal: '브레인스토밍 확장';
  language: 'ko';
};

const COMMON_RULES = [
  '당신은 학생의 브레인스토밍을 돕는 한국어 아이디어 코치입니다.',
  '분석 대상은 오직 currentNodeTitle입니다. 버튼, 라벨, UI 단어는 절대 분석하지 마세요.',
  '반드시 현재 아이디어의 특징을 먼저 해석하세요.',
  '형태, 분위기, 질감, 상징성, 대비감, 용도 중 최소 하나 이상을 짚으세요.',
  'suggestion은 analysis를 반복하지 말고 실제 다음 탐색 방향을 제안해야 합니다.',
  'nextNodeCandidates는 실제 하위 노드로 추가 가능한 짧은 명사구여야 합니다.',
  '모든 결과는 한국어로 작성하세요.',
  'analysis는 1~2문장, suggestion은 1~2문장, nextNodeCandidates는 2~4개여야 합니다.',
  '현재 문장을 그대로 반복하지 마세요.',
  '절대로 아래 표현을 쓰지 마세요: 이 아이디어를 발전시켜보면 좋겠습니다 / 이렇게 해보는 것은 어떨까요 / 다양한 방향으로 생각해볼 수 있습니다 / 흥미로운 아이디어입니다 / 아이디어는 보통',
  '추상적인 응원, 의미 없는 일반론, UI 라벨 분석은 금지입니다.',
  '반드시 JSON 객체로만 답하세요.',
  '형식: {"analysis":"...","suggestion":"...","nextNodeCandidates":["...", "..."]}'
].join('\n');

const FEW_SHOTS = [
  `예시 1
입력:
{
  "currentNodeTitle": "구름을 닮은 폰트",
  "actionType": "expand"
}
출력:
{
  "analysis": "구름은 경계가 흐리고 둥글게 퍼지는 부드러운 덩어리감이 특징이에요.",
  "suggestion": "이 이미지를 폰트에 적용해서 획의 끝을 흐리게 처리하거나 자간이 공기처럼 퍼지는 방향을 생각해볼 수 있어요.",
  "nextNodeCandidates": ["흐릿한 획", "퍼지는 자간", "둥근 덩어리 형태"]
}`,
  `예시 2
입력:
{
  "currentNodeTitle": "돌처럼 무거운 의자",
  "actionType": "opposite"
}
출력:
{
  "analysis": "이 아이디어의 핵심은 단단함, 무게감, 정적인 인상이에요.",
  "suggestion": "반대로 거의 떠 있는 것처럼 가볍고 불안정해 보이는 의자로 뒤집으면 강한 대비가 생길 수 있어요.",
  "nextNodeCandidates": ["풍선 같은 의자", "투명한 구조", "얇은 막 형태"]
}`,
  `예시 3
입력:
{
  "currentNodeTitle": "비눗방울 조명",
  "actionType": "extreme"
}
출력:
{
  "analysis": "이 아이디어는 투명함, 반사, 금방 사라질 듯한 연약함이 중심이에요.",
  "suggestion": "이 특징을 극단적으로 밀면 표면이 흔들리거나 빛이 공간 전체에 번지는 조명으로 발전시킬 수 있어요.",
  "nextNodeCandidates": ["빛이 번지는 막", "불안정한 표면", "깨질 듯 얇은 조명"]
}`
].join('\n\n');

const buildContextBlock = (input: BrainstormPromptInput) =>
  [
    `currentNodeTitle: ${input.currentNodeTitle}`,
    `parentNodeTitle: ${input.parentNodeTitle ?? ''}`,
    `siblingNodeTitles: ${JSON.stringify(input.siblingNodeTitles)}`,
    `childNodeTitles: ${JSON.stringify(input.childNodeTitles)}`,
    `actionType: ${input.actionType}`,
    `userGoal: ${input.userGoal}`,
    `language: ${input.language}`
  ].join('\n');

export const buildExpandPrompt = (input: BrainstormPromptInput) =>
  [
    COMMON_RULES,
    FEW_SHOTS,
    '액션 목표: 현재 아이디어의 속성, 분위기, 기능, 상징성을 해석하고 더 발전시킬 수 있는 세부 방향을 제안하세요.',
    buildContextBlock(input)
  ].join('\n\n');

export const buildOppositePrompt = (input: BrainstormPromptInput) =>
  [
    COMMON_RULES,
    FEW_SHOTS,
    '액션 목표: 현재 아이디어의 핵심 특징을 반대로 뒤집어서 새로운 해석이 가능하도록 제안하세요.',
    buildContextBlock(input)
  ].join('\n\n');

export const buildExtremePrompt = (input: BrainstormPromptInput) =>
  [
    COMMON_RULES,
    FEW_SHOTS,
    '액션 목표: 현재 아이디어의 특징을 과장하거나 극단적으로 밀어붙여 더 강한 인상과 구체적 발상으로 이어지게 하세요.',
    buildContextBlock(input)
  ].join('\n\n');

export const buildCombinePrompt = (input: BrainstormPromptInput) =>
  [
    COMMON_RULES,
    FEW_SHOTS,
    '액션 목표: 현재 아이디어를 전혀 다른 분야, 재료, 감성, 맥락과 연결해 새로운 조합을 제안하세요.',
    buildContextBlock(input)
  ].join('\n\n');
