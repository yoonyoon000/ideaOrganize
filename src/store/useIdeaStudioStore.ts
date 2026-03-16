import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { loadFolders, loadIdeas, saveFolders, saveIdeas } from '../lib/storage';
import type { Folder, Idea } from '../types';

type IdeaStudioStore = {
  ideas: Idea[];
  folders: Folder[];
  createIdea: (input?: Partial<Pick<Idea, 'title' | 'sourceNodeId' | 'folderId'>>) => string;
  updateIdea: (id: string, patch: Partial<Idea>) => void;
  deleteIdea: (id: string) => void;
  toggleBookmark: (id: string) => void;
  createFolder: (name: string) => void;
  deleteFolder: (id: string) => void;
};

const persistIdeas = (ideas: Idea[]) => {
  saveIdeas(ideas);
  return ideas;
};

const persistFolders = (folders: Folder[]) => {
  saveFolders(folders);
  return folders;
};

export const useIdeaStudioStore = create<IdeaStudioStore>((set) => ({
  ideas: loadIdeas(),
  folders: loadFolders(),
  createIdea: (input) => {
    const id = nanoid();
    const now = Date.now();
    const idea: Idea = {
      id,
      title: input?.title?.trim() || '새 아이디어',
      description: '',
      tags: [],
      bookmarked: false,
      folderId: input?.folderId,
      sourceNodeId: input?.sourceNodeId,
      createdAt: now,
      updatedAt: now,
      referenceLinks: [],
      referenceImages: [],
      sketchImages: []
    };

    set((state) => ({
      ideas: persistIdeas([idea, ...state.ideas])
    }));

    return id;
  },
  updateIdea: (id, patch) => {
    set((state) => ({
      ideas: persistIdeas(
        state.ideas.map((idea) =>
          idea.id === id
            ? {
                ...idea,
                ...patch,
                updatedAt: Date.now()
              }
            : idea
        )
      )
    }));
  },
  deleteIdea: (id) => {
    set((state) => ({
      ideas: persistIdeas(state.ideas.filter((idea) => idea.id !== id))
    }));
  },
  toggleBookmark: (id) => {
    set((state) => ({
      ideas: persistIdeas(
        state.ideas.map((idea) =>
          idea.id === id
            ? {
                ...idea,
                bookmarked: !idea.bookmarked,
                updatedAt: Date.now()
              }
            : idea
        )
      )
    }));
  },
  createFolder: (name) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }

    set((state) => ({
      folders: persistFolders([
        ...state.folders,
        {
          id: nanoid(),
          name: trimmed
        }
      ])
    }));
  },
  deleteFolder: (id) => {
    set((state) => ({
      folders: persistFolders(state.folders.filter((folder) => folder.id !== id)),
      ideas: persistIdeas(
        state.ideas.map((idea) =>
          idea.folderId === id
            ? {
                ...idea,
                folderId: undefined,
                updatedAt: Date.now()
              }
            : idea
        )
      )
    }));
  }
}));
