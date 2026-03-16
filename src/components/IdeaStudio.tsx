import { useMemo, useState } from 'react';
import IdeaCard from './IdeaCard';
import FolderSidebar from './FolderSidebar';
import type { Folder, Idea } from '../types';

type IdeaStudioProps = {
  ideas: Idea[];
  folders: Folder[];
  onCreateIdea: () => void;
  onOpenIdea: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  onCreateFolder: (name: string) => void;
};

export default function IdeaStudio({
  ideas,
  folders,
  onCreateIdea,
  onOpenIdea,
  onToggleBookmark,
  onCreateFolder
}: IdeaStudioProps) {
  const [query, setQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | 'all'>('all');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);

  const filteredIdeas = useMemo(
    () =>
      ideas.filter((idea) => {
        const matchesQuery =
          query.trim().length === 0 ||
          idea.title.toLowerCase().includes(query.toLowerCase()) ||
          (idea.description ?? '').toLowerCase().includes(query.toLowerCase());
        const matchesFolder = selectedFolderId === 'all' || idea.folderId === selectedFolderId;
        const matchesBookmark = !onlyBookmarked || idea.bookmarked;

        return matchesQuery && matchesFolder && matchesBookmark;
      }),
    [ideas, onlyBookmarked, query, selectedFolderId]
  );

  return (
    <section className="idea-studio-layout">
      <FolderSidebar
        folders={folders}
        selectedFolderId={selectedFolderId}
        onSelect={setSelectedFolderId}
        onCreateFolder={onCreateFolder}
      />

      <div className="idea-studio-main">
        <div className="idea-studio-toolbar">
          <input
            className="studio-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="아이디어 검색"
          />
          <button
            type="button"
            className={onlyBookmarked ? 'primary-button' : 'secondary-button'}
            onClick={() => setOnlyBookmarked((current) => !current)}
          >
            ⭐ 북마크 보기
          </button>
          <button type="button" className="primary-button" onClick={onCreateIdea}>
            새 아이디어
          </button>
        </div>

        <div className="idea-grid">
          {filteredIdeas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              folder={folders.find((folder) => folder.id === idea.folderId)}
              onOpen={() => onOpenIdea(idea.id)}
              onToggleBookmark={() => onToggleBookmark(idea.id)}
            />
          ))}
          {filteredIdeas.length === 0 && (
            <div className="idea-empty">조건에 맞는 아이디어가 없습니다.</div>
          )}
        </div>
      </div>
    </section>
  );
}
