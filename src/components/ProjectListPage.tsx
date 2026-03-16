import { useMemo } from 'react';
import ProjectListItem from './ProjectListItem';
import type { Project } from '../types';

type ProjectListPageProps = {
  projects: Project[];
  onCreateProject: () => void;
  onOpenProject: (id: string) => void;
  onLogout: () => void;
};

export default function ProjectListPage({
  projects,
  onCreateProject,
  onOpenProject,
  onLogout
}: ProjectListPageProps) {
  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => b.updatedAt - a.updatedAt),
    [projects]
  );

  return (
    <main className="project-list-page">
      <div className="project-list-header">
        <div>
          <p className="eyebrow">Project Files</p>
          <h1>프로젝트 리스트</h1>
          <p className="subtext">브레인스토밍 마인드맵을 프로젝트 단위로 만들고 다시 열 수 있습니다.</p>
        </div>
        <div className="project-list-actions">
          <button type="button" className="secondary-button" onClick={onLogout}>
            로그아웃
          </button>
          <button type="button" className="primary-button" onClick={onCreateProject}>
            새 프로젝트 만들기
          </button>
        </div>
      </div>

      <section className="project-list-panel">
        {sortedProjects.length > 0 ? (
          <div className="project-list">
            {sortedProjects.map((project) => (
              <ProjectListItem
                key={project.id}
                project={project}
                onOpen={() => onOpenProject(project.id)}
              />
            ))}
          </div>
        ) : (
          <div className="project-empty">
            <p>아직 프로젝트가 없습니다.</p>
            <span>새 프로젝트를 만들면 이곳에 마인드맵 파일처럼 쌓입니다.</span>
          </div>
        )}
      </section>
    </main>
  );
}
