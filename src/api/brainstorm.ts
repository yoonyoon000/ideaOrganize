import type { AiSuggestion, BrainstormPromptInput } from '../types';

type BrainstormResponse = {
  suggestion: AiSuggestion;
};

export const requestBrainstormSuggestion = async (payload: BrainstormPromptInput) => {
  console.debug('[AI brainstorm request]', payload);

  const response = await fetch('/api/brainstorm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error('AI 제안을 불러오지 못했습니다.');
  }

  const data = (await response.json()) as BrainstormResponse;
  return data.suggestion;
};
