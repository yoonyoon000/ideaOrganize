import { useState } from 'react';
import type { Folder } from '../types';

type FolderSidebarProps = {
  folders: Folder[];
  selectedFolderId: string | 'all';
  onSelect: (folderId: string | 'all') => void;
  onCreateFolder: (name: string) => void;
};

export default function FolderSidebar({
  folders,
  selectedFolderId,
  onSelect,
  onCreateFolder
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
        <button
          key={folder.id}
          type="button"
          className={selectedFolderId === folder.id ? 'folder-item folder-item-active' : 'folder-item'}
          onClick={() => onSelect(folder.id)}
        >
          {folder.name}
        </button>
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
