import type { AiSuggestionResponse } from './types.js';

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string' && item.trim().length > 0);

export const parseIdeaSuggestionResponse = (rawText: string): AiSuggestionResponse | null => {
  try {
    const parsed = JSON.parse(rawText) as Partial<AiSuggestionResponse>;

    if (
      typeof parsed.analysis !== 'string' ||
      typeof parsed.suggestion !== 'string' ||
      !isStringArray(parsed.nextNodeCandidates)
    ) {
      return null;
    }

    return {
      analysis: parsed.analysis.trim(),
      suggestion: parsed.suggestion.trim(),
      nextNodeCandidates: parsed.nextNodeCandidates
        .map((candidate: string) => candidate.trim())
        .slice(0, 4)
    };
  } catch {
    return null;
  }
};
