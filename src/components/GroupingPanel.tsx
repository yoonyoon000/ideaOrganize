import type { IdeaGroup } from '../types';

type GroupingPanelProps = {
  groups: Array<
    IdeaGroup & {
      ideas: Array<{ id: string; text: string; parentText: string | null }>;
    }
  >;
  isGrouping: boolean;
  onGroup: () => void;
};

export default function GroupingPanel({
  groups,
  isGrouping,
  onGroup
}: GroupingPanelProps) {
  return (
    <section className="grouped-view">
      <div className="grouped-header">
        <div>
          <p className="eyebrow">AI 묶어보기</p>
          <h2>겹치는 단어와 아이디어를 모아봅니다</h2>
          <p className="panel-hint">묶인 결과뿐 아니라, 각 단어가 원래 어떤 가지에서 나왔는지도 함께 확인할 수 있습니다.</p>
        </div>
        <button type="button" className="primary-button" onClick={onGroup} disabled={isGrouping}>
          {isGrouping ? '묶는 중...' : 'AI로 다시 분석하기'}
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="group-empty">
          <p>아직 묶인 아이디어가 없습니다.</p>
          <span>노드를 더 추가한 뒤 AI 묶어보기를 실행하면 여기에서 결과를 확인할 수 있습니다.</span>
        </div>
      ) : (
        <div className="group-card-grid">
          {groups.map((group) => (
            <article key={group.id} className="group-card">
              <p className="eyebrow">그룹</p>
              <h3>{group.label}</h3>
              <p>{group.reason}</p>
              <strong>{group.nodeIds.length}개 노드 연결</strong>
              <div className="group-idea-list">
                {group.ideas.map((idea) => (
                  <div key={idea.id} className="group-idea-item">
                    <span>{idea.text}</span>
                    <small>이전 아이디어: {idea.parentText ?? '중심 아이디어'}</small>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
