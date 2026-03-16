import { useEffect, useState } from 'react';
import HomeButton from './HomeButton';

type HeaderProps = {
  projectTitle: string;
  onChangeProjectTitle: (title: string) => void;
  onGoHome: () => void;
  workspaceMode: 'mindmap' | 'studio' | 'detail';
  onOpenMindMap: () => void;
  onOpenStudio: () => void;
  viewMode: 'spread' | 'structured' | 'grouped';
  onChangeView: (viewMode: 'spread' | 'structured' | 'grouped') => void;
};

export default function Header({
  projectTitle,
  onChangeProjectTitle,
  onGoHome,
  workspaceMode,
  onOpenMindMap,
  onOpenStudio,
  viewMode,
  onChangeView
}: HeaderProps) {
  const [draftTitle, setDraftTitle] = useState(projectTitle);

  useEffect(() => {
    setDraftTitle(projectTitle);
  }, [projectTitle]);

  return (
    <header className="app-header">
      <div>
        <p className="eyebrow">브레인스토밍 마인드맵</p>
        <h1>아이디어 마인드맵</h1>
        <input
          className="project-title-input"
          value={draftTitle}
          onChange={(event) => setDraftTitle(event.target.value)}
          onBlur={() => onChangeProjectTitle(draftTitle)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onChangeProjectTitle(draftTitle);
              event.currentTarget.blur();
            }
          }}
          placeholder="프로젝트 제목"
        />
        {workspaceMode === 'mindmap' && (
          <div className="header-inline-group">
            <span className="header-group-label">마인드맵 보기</span>
            <div className="view-toggle">
              <button
                type="button"
                className={viewMode === 'spread' ? 'primary-button' : 'secondary-button'}
                onClick={() => onChangeView('spread')}
              >
                자유형 보기
              </button>
              <button
                type="button"
                className={viewMode === 'structured' ? 'primary-button' : 'secondary-button'}
                onClick={() => onChangeView('structured')}
              >
                구조형 보기
              </button>
              <button
                type="button"
                className={viewMode === 'grouped' ? 'primary-button' : 'secondary-button'}
                onClick={() => onChangeView('grouped')}
              >
                AI 묶어보기
              </button>
            </div>
          </div>
        )}
        <p className="subtext">
          마인드맵에서 아이디어를 넓히고, 아이디어 스튜디오에서 더 구체적으로 정리할 수 있게 했습니다.
        </p>
      </div>

      <div className="header-actions">
        <HomeButton href="/" onClick={onGoHome} />
        <div className="header-group">
          <span className="header-group-label">작업 공간</span>
          <div className="view-toggle">
            <button
              type="button"
              className={workspaceMode === 'mindmap' ? 'primary-button' : 'secondary-button'}
              onClick={onOpenMindMap}
            >
              마인드맵
            </button>
            <button
              type="button"
              className={workspaceMode === 'studio' || workspaceMode === 'detail' ? 'primary-button' : 'secondary-button'}
              onClick={onOpenStudio}
            >
              아이디어 스튜디오
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
