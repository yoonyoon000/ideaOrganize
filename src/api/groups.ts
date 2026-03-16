import type { GroupableIdea, IdeaGroup } from '../types';

type GroupIdeasResponse = {
  groups: IdeaGroup[];
};

export const groupIdeas = async (ideas: GroupableIdea[]) => {
  const response = await fetch('/api/group-ideas', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ideas })
  });

  if (!response.ok) {
    throw new Error('아이디어 묶기에 실패했습니다.');
  }

  const data = (await response.json()) as GroupIdeasResponse;
  return data.groups;
};
