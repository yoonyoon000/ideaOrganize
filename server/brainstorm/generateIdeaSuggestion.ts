import OpenAI from 'openai';
import {
  buildCombinePrompt,
  buildExpandPrompt,
  buildExtremePrompt,
  buildOppositePrompt,
  type BrainstormPromptInput
} from './promptBuilders.js';
import { parseIdeaSuggestionResponse } from './parseIdeaSuggestionResponse.js';
import type { AiSuggestionResponse } from './types.js';

type AiActionType = BrainstormPromptInput['actionType'];

const promptBuilderMap: Record<AiActionType, (input: BrainstormPromptInput) => string> = {
  expand: buildExpandPrompt,
  opposite: buildOppositePrompt,
  extreme: buildExtremePrompt,
  combine: buildCombinePrompt
};

const fallbackSuggestion = (input: BrainstormPromptInput): AiSuggestionResponse => {
  const seed = input.currentNodeTitle;

  return {
    analysis: `${seed}에는 눈에 보이는 형태나 분위기를 더 세밀하게 풀어낼 여지가 있어요.`,
    suggestion: `지금 인상에서 가장 강하게 느껴지는 성질을 한 단계 더 구체화해서 다음 하위 아이디어로 분해해보세요.`,
    nextNodeCandidates: [
      `${seed}의 질감`,
      `${seed}의 분위기`,
      `${seed}의 사용 장면`
    ]
  };
};

export const generateIdeaSuggestion = async ({
  client,
  model,
  input
}: {
  client: OpenAI | null;
  model: string;
  input: BrainstormPromptInput;
}) => {
  const prompt = promptBuilderMap[input.actionType](input);

  console.debug('[AI brainstorm payload]', input);

  if (!client) {
    return fallbackSuggestion(input);
  }

  try {
    const completion = await client.responses.create({
      model,
      input: prompt
    });

    const parsed = parseIdeaSuggestionResponse(completion.output_text.trim());
    return parsed ?? fallbackSuggestion(input);
  } catch {
    return fallbackSuggestion(input);
  }
};
