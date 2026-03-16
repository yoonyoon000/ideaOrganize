import { useMemo, useState } from 'react';

type OnboardingModalProps = {
  open: boolean;
  onSubmit: (mainIdea: string, keywords: string[]) => void;
};

export default function OnboardingModal({ open, onSubmit }: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [mainIdea, setMainIdea] = useState('');
  const [keywords, setKeywords] = useState(['', '', '', '', '']);

  const canMoveNext = mainIdea.trim().length > 0;
  const canSubmit = useMemo(
    () => keywords.every((keyword) => keyword.trim().length > 0),
    [keywords]
  );

  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop">
      <div className="onboarding-modal">
        <p className="eyebrow">시작하기</p>
        {step === 1 ? (
          <>
            <h2>생각하고 싶은 아이디어를 적으세요</h2>
            <p className="subtext">이 아이디어가 중심 노드가 되고, 다음 단계에서 첫 번째 가지 다섯 개를 만듭니다.</p>
            <textarea
              className="onboarding-textarea"
              value={mainIdea}
              onChange={(event) => setMainIdea(event.target.value)}
              placeholder="예: 혼자 공부하는 사람을 위한 집중 루틴 서비스"
              rows={4}
              autoFocus
            />
            <div className="modal-actions">
              <button
                type="button"
                className="primary-button"
                disabled={!canMoveNext}
                onClick={() => setStep(2)}
              >
                다음
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>해당 아이디어 관련 단어 5개를 적어주세요</h2>
            <p className="subtext">입력한 다섯 단어가 중심 아이디어에서 자유롭게 뻗어나가는 첫 시작점이 됩니다.</p>
            <div className="keyword-grid">
              {keywords.map((keyword, index) => (
                <input
                  key={index}
                  className="keyword-input"
                  value={keyword}
                  onChange={(event) => {
                    const nextKeywords = [...keywords];
                    nextKeywords[index] = event.target.value;
                    setKeywords(nextKeywords);
                  }}
                  placeholder={`관련 단어 ${index + 1}`}
                />
              ))}
            </div>
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setStep(1)}>
                이전
              </button>
              <button
                type="button"
                className="primary-button"
                disabled={!canSubmit}
                onClick={() => onSubmit(mainIdea.trim(), keywords.map((keyword) => keyword.trim()))}
              >
                시작하기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
