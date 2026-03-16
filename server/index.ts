import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { nanoid } from 'nanoid';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 8787);
const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_request, response) => {
  response.json({ ok: true });
});

const normalizeText = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const extractKeywords = (text: string) => {
  const normalized = normalizeText(text);
  return normalized
    .split(' ')
    .filter((token) => token.length >= 2)
    .filter((token) => !['아이디어', '기능', '서비스', '시스템', '화면', '사용자'].includes(token));
};

app.post('/api/group-ideas', async (request, response) => {
  const { ideas } = request.body as {
    ideas?: Array<{ id: string; text: string; parentText?: string | null }>;
  };

  if (!ideas || ideas.length === 0) {
    response.status(400).json({ message: '아이디어 목록이 비어 있습니다.' });
    return;
  }

  if (!client) {
    const bucket = new Map<string, Set<string>>();

    ideas.forEach((idea) => {
      const keywords = new Set([
        normalizeText(idea.text),
        ...extractKeywords(idea.text)
      ]);

      keywords.forEach((keyword) => {
        if (!keyword || keyword.length < 2) {
          return;
        }

        if (!bucket.has(keyword)) {
          bucket.set(keyword, new Set());
        }

        bucket.get(keyword)!.add(idea.id);
      });
    });

    const groups = Array.from(bucket.entries())
      .filter(([, nodeIds]) => nodeIds.size > 1)
      .sort((a, b) => b[1].size - a[1].size)
      .map(([label, nodeIds]) => ({
        id: nanoid(),
        label,
        nodeIds: Array.from(nodeIds),
        reason: '같은 핵심 단어가 포함된 아이디어를 기본 규칙으로 묶었습니다.'
      }));

    response.json({ groups });
    return;
  }

  try {
    const prompt = [
      '당신은 한국어 브레인스토밍 마인드맵에서 겹치는 단어를 묶는 편집자입니다.',
      '입력된 아이디어들 중 의미상 같거나 매우 비슷한 항목만 그룹으로 묶으세요.',
      '완전히 같은 문장이 아니어도 같은 핵심 단어가 들어가면 함께 묶을 수 있습니다.',
      '예를 들어 같은 명사, 같은 주제어, 같은 대상이 반복되면 그룹 후보입니다.',
      '최소 2개 이상의 노드가 있을 때만 그룹을 만드세요.',
      '억지로 모든 항목을 묶지 마세요.',
      '반드시 JSON 객체 하나만 반환하세요.',
      '형식: {"groups":[{"id":"임의문자열","label":"짧은 그룹명","nodeIds":["id1","id2"],"reason":"짧은 설명"}]}',
      `아이디어 목록: ${JSON.stringify(ideas)}`
    ].join('\n');

    const completion = await client.responses.create({
      model,
      input: prompt
    });

    const parsed = JSON.parse(completion.output_text.trim()) as {
      groups?: Array<{ id?: string; label: string; nodeIds: string[]; reason: string }>;
    };

    response.json({
      groups: (parsed.groups ?? [])
        .filter((group) => Array.isArray(group.nodeIds) && group.nodeIds.length > 1)
        .map((group) => ({
          id: group.id || nanoid(),
          label: group.label,
          nodeIds: group.nodeIds,
          reason: group.reason
        }))
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: 'AI 그룹 응답 처리에 실패했습니다.' });
  }
});

app.listen(port, () => {
  console.log(`Mind map API server running on http://localhost:${port}`);
});
