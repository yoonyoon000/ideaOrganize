type HeaderProps = {
  onReset: () => void;
  onExportPng: () => void;
  viewMode: 'spread' | 'structured' | 'grouped';
  onChangeView: (viewMode: 'spread' | 'structured' | 'grouped') => void;
};

export default function Header({
  onReset,
  onExportPng,
  viewMode,
  onChangeView
}: HeaderProps) {
  return (
    <header className="app-header">
      <div>
        <p className="eyebrow">브레인스토밍 마인드맵</p>
        <h1>아이디어 마인드맵</h1>
        <p className="subtext">자유형, 구조형, AI 묶어보기를 분리해서 생각 흐름과 정리를 따로 볼 수 있게 했습니다.</p>
      </div>

      <div className="header-actions">
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
        <button type="button" className="secondary-button" onClick={onExportPng}>
          PNG 저장
        </button>
        <button type="button" className="secondary-button" onClick={onReset}>
          처음부터
        </button>
      </div>
    </header>
  );
}
