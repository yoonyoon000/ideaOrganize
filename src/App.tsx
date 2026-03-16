import { useEffect, useMemo, useState } from 'react';
import MindMapPage from './components/MindMapPage';
import ProjectListPage from './components/ProjectListPage';
import { useProjectStore } from './store/useProjectStore';

export default function App() {
  const { projects, selectedProjectId, createProject, selectProject } = useProjectStore();
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const routeProjectId = useMemo(() => {
    const match = pathname.match(/^\/projects\/([^/]+)$/);
    return match ? decodeURIComponent(match[1]) : null;
  }, [pathname]);

  const navigate = (nextPath: string) => {
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
    setPathname(nextPath);
  };

  useEffect(() => {
    if (routeProjectId) {
      if (selectedProjectId !== routeProjectId) {
        selectProject(routeProjectId);
      }
      return;
    }
  }, [routeProjectId, selectProject, selectedProjectId]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  if (!routeProjectId || !selectedProject || selectedProject.id !== routeProjectId) {
    return (
      <ProjectListPage
        projects={projects}
        onCreateProject={() => {
          const projectId = createProject();
          navigate(`/projects/${projectId}`);
        }}
        onOpenProject={(projectId) => {
          selectProject(projectId);
          navigate(`/projects/${projectId}`);
        }}
      />
    );
  }

  return <MindMapPage project={selectedProject} onGoHome={() => navigate('/')} />;
}
