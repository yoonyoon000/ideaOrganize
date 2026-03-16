import { useState } from 'react';
import type { Folder } from '../types';

type FolderSidebarProps = {
  folders: Folder[];
  selectedFolderId: string | 'all';
  onSelect: (folderId: string | 'all') => void;
  onCreateFolder: (name: string) => void;
  onDeleteFolder: (folderId: string) => void;
};

export default function FolderSidebar({
  folders,
  selectedFolderId,
  onSelect,
  onCreateFolder,
  onDeleteFolder
}: FolderSidebarProps) {
  const [name, setName] = useState('');

  return (
    <aside className="folder-sidebar">
      <p className="eyebrow">폴더</p>
      <button
        type="button"
        className={selectedFolderId === 'all' ? 'folder-item folder-item-active' : 'folder-item'}
        onClick={() => onSelect('all')}
      >
        전체 아이디어
      </button>
      {folders.map((folder) => (
        <div key={folder.id} className="folder-row">
          <button
            type="button"
            className={selectedFolderId === folder.id ? 'folder-item folder-item-active' : 'folder-item'}
            onClick={() => onSelect(folder.id)}
          >
            {folder.name}
          </button>
          <button
            type="button"
            className="folder-delete-button"
            aria-label="폴더 삭제"
            onClick={() => {
              if (window.confirm('이 폴더를 삭제하겠습니까?')) {
                onDeleteFolder(folder.id);
              }
            }}
          >
            ×
          </button>
        </div>
      ))}
      <div className="folder-create">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="새 폴더"
        />
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            onCreateFolder(name);
            setName('');
          }}
        >
          폴더 생성
        </button>
      </div>
    </aside>
  );
}
