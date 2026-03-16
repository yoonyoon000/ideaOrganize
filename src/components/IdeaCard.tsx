import BookmarkButton from './BookmarkButton';
import type { Folder, Idea } from '../types';

type IdeaCardProps = {
  idea: Idea;
  folder?: Folder;
  onOpen: () => void;
  onToggleBookmark: () => void;
};

export default function IdeaCard({ idea, folder, onOpen, onToggleBookmark }: IdeaCardProps) {
  return (
    <article className="idea-card" onClick={onOpen}>
      <div className="idea-card-head">
        <BookmarkButton
          active={idea.bookmarked}
          onClick={() => {
            onToggleBookmark();
          }}
        />
        <h3>{idea.title}</h3>
      </div>
      <div className="idea-card-meta">
        <span>created: {new Date(idea.createdAt).toLocaleDateString('ko-KR')}</span>
        <span>folder: {folder?.name ?? '없음'}</span>
      </div>
    </article>
  );
}
