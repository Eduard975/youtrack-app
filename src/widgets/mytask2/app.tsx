import React, { memo, useCallback, useEffect, useState } from "react";
import Button from "@jetbrains/ring-ui-built/components/button/button";
import Text from "@jetbrains/ring-ui-built/components/text/text";
import ErrorMessage from "@jetbrains/ring-ui-built/components/error-message/error-message";
import frownIcon from "@jetbrains/icons/frown";
import { useYouTrackHost } from "./hooks/useYouTrack";
import { YouTrackAPI } from "./services/api";
import { Project, ProjectStatus } from "./types/project";
import ProjectList from "./components/ProjectList";

const AppComponent: React.FC = () => {
  const { host, error: hostError } = useYouTrackHost();
  const [api, setApi] = useState<YouTrackAPI | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [statuses, setStatuses] = useState<Record<string, ProjectStatus>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize API when host is ready
  useEffect(() => {
    if (host) {
      setApi(new YouTrackAPI(host));
    }
  }, [host]);

  const loadProjects = useCallback(async () => {
    if (!api) {
      setError("API not initialized");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const projectsData = await api.getProjects();
      console.log("Projects loaded", projectsData);
      setProjects(projectsData);
    } catch (err: any) {
      console.error("Error loading projects:", err);
      setError(err.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [api]);

  const handleToggle = useCallback(
    async (projectId: string) => {
      if (!api) return;

      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      const newFinishedValue = !project.finished;

      setStatuses((prev) => ({ ...prev, [projectId]: "updating" }));

      try {
        // The API will now handle all the setup automatically
        await api.updateProjectFinishedStatus(projectId, newFinishedValue);

        // Update local state on success
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId ? { ...p, finished: newFinishedValue } : p
          )
        );
        setStatuses((prev) => ({ ...prev, [projectId]: "none" }));

        console.log(
          `Project ${projectId} finished status updated to ${newFinishedValue}`
        );
      } catch (err: any) {
        console.error("Error updating project:", err);
        setStatuses((prev) => ({ ...prev, [projectId]: "error" }));

        // Clear error after 5 seconds
        setTimeout(() => {
          setStatuses((prev) => ({ ...prev, [projectId]: "none" }));
        }, 5000);
      }
    },
    [api, projects]
  );

  // Load projects on mount
  useEffect(() => {
    if (api) {
      loadProjects();
    }
  }, [api, loadProjects]);

  // Show initialization state
  if (!host && !hostError) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <Text>Initializing YouTrack plugin...</Text>
      </div>
    );
  }

  // Show error state
  if (hostError || error) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <ErrorMessage icon={frownIcon} message={hostError || error || ""} />
        <div style={{ marginTop: "1rem" }}>
          <Button onClick={loadProjects} disabled={!api}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <div
        style={{
          marginBottom: "1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text size={Text.Size.L}>Projects ({projects.length})</Text>
        <Button onClick={loadProjects} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {loading && projects.length === 0 ? (
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <Text>Loading projects...</Text>
        </div>
      ) : (
        <ProjectList
          projects={projects}
          statuses={statuses}
          onToggle={handleToggle}
        />
      )}
    </div>
  );
};

export const App = memo(AppComponent);
