import { useState } from 'react';

type UserEntryPageProps = {
  onSubmit: (userId: string) => void;
};

export default function UserEntryPage({ onSubmit }: UserEntryPageProps) {
  const [userId, setUserId] = useState('');

  return (
    <main className="user-entry-page">
      <section className="user-entry-card">
        <p className="eyebrow">Welcome</p>
        <h1>아이디를 입력하세요</h1>
        <p className="subtext">
          입력한 아이디를 기준으로 프로젝트 리스트와 작업 내용이 따로 저장됩니다.
        </p>
        <form
          className="user-entry-form"
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = userId.trim();
            if (!trimmed) {
              return;
            }
            onSubmit(trimmed);
          }}
        >
          <input
            className="user-entry-input"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            autoFocus
          />
          <button type="submit" className="primary-button">
            시작하기
          </button>
        </form>
      </section>
    </main>
  );
}
