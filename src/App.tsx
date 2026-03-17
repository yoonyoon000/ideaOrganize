import { useEffect, useMemo, useState } from 'react';
import MindMapPage from './components/MindMapPage';
import ProjectListPage from './components/ProjectListPage';
import UserEntryPage from './components/UserEntryPage';
import { useProjectStore } from './store/useProjectStore';

export default function App() {
  const {
    currentUserId,
    projects,
    selectedProjectId,
    createProject,
    clearCurrentUserId,
    selectProject,
    setCurrentUserId
  } = useProjectStore();
  const [routePath, setRoutePath] = useState(() => getRoutePath());

  useEffect(() => {
    const handleRouteChange = () => {
      setRoutePath(getRoutePath());
    };

    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('hashchange', handleRouteChange);
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('hashchange', handleRouteChange);
    };
  }, []);

  const routeProjectId = useMemo(() => {
    const match = routePath.match(/^\/projects\/([^/]+)$/);
    return match ? decodeURIComponent(match[1]) : null;
  }, [routePath]);

  const navigate = (nextPath: string) => {
    const normalizedPath = nextPath.startsWith('/') ? nextPath : `/${nextPath}`;
    const nextHash = `#${normalizedPath}`;

    if (window.location.hash !== nextHash) {
      window.history.pushState({}, '', nextHash);
    }
    setRoutePath(normalizedPath);
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

  if (!currentUserId) {
    return <UserEntryPage onSubmit={setCurrentUserId} />;
  }

  if (!routeProjectId || !selectedProject || selectedProject.id !== routeProjectId) {
    return (
      <ProjectListPage
        projects={projects}
        onLogout={() => {
          clearCurrentUserId();
          navigate('/');
        }}
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

  return (
    <MindMapPage
      project={selectedProject}
      onGoHome={() => navigate('/')}
      onLogout={() => {
        clearCurrentUserId();
        navigate('/');
      }}
    />
  );
}

const getRoutePath = () => {
  const hash = window.location.hash.replace(/^#/, '');
  return hash || '/';
};
