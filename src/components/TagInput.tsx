import { useState } from 'react';

type TagInputProps = {
  tags: string[];
  onChange: (tags: string[]) => void;
};

export default function TagInput({ tags, onChange }: TagInputProps) {
  const [value, setValue] = useState('');

  const addTag = () => {
    const trimmed = value.trim().replace(/^#/, '');
    if (!trimmed || tags.includes(trimmed)) {
      setValue('');
      return;
    }

    onChange([...tags, trimmed]);
    setValue('');
  };

  return (
    <div className="tag-input-wrap">
      <div className="tag-list">
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            className="tag-pill"
            onClick={() => onChange(tags.filter((item) => item !== tag))}
          >
            #{tag}
          </button>
        ))}
      </div>
      <div className="tag-input-row">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addTag();
            }
          }}
          placeholder="태그 추가"
        />
        <button type="button" className="secondary-button" onClick={addTag}>
          추가
        </button>
      </div>
    </div>
  );
}
