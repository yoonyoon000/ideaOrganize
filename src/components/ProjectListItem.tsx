import type { Project } from '../types';

type ProjectListItemProps = {
  project: Project;
  onOpen: () => void;
};

export default function ProjectListItem({ project, onOpen }: ProjectListItemProps) {
  return (
    <a
      href={`#/projects/${project.id}`}
      className="project-list-item"
      onClick={(event) => {
        event.preventDefault();
        onOpen();
      }}
    >
      <strong>{project.title}</strong>
      <span>작성일: {formatDate(project.createdAt)}</span>
      <span>수정일: {formatDate(project.updatedAt)}</span>
    </a>
  );
}

const formatDate = (value: number) =>
  new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(value);
