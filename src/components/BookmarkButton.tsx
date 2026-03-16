type BookmarkButtonProps = {
  active: boolean;
  onClick: () => void;
};

export default function BookmarkButton({ active, onClick }: BookmarkButtonProps) {
  return (
    <button
      type="button"
      className={`bookmark-button ${active ? 'bookmark-button-active' : ''}`}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      {active ? '★' : '☆'}
    </button>
  );
}
