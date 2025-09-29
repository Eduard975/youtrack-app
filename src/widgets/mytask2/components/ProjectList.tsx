import React from "react";
import Text from "@jetbrains/ring-ui-built/components/text/text";
import { Grid, Row, Col } from "@jetbrains/ring-ui-built/components/grid/grid";
import Toggle, {
  Size,
} from "@jetbrains/ring-ui-built/components/toggle/toggle";
import { Project, ProjectStatus } from "../types/project";

interface ProjectListProps {
  projects: Project[];
  statuses: Record<string, ProjectStatus>;
  onToggle: (projectId: string) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  statuses,
  onToggle,
}) => {
  if (projects.length === 0) {
    return (
      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <Text>No projects found</Text>
      </div>
    );
  }

  return (
    <Grid>
      {projects.map((project) => (
        <Row key={project.id}>
          <Col xs={12} sm={4} md={3} lg={3}>
            <Text size={Text.Size.M} info>
              {project.shortName}
            </Text>
          </Col>
          <Col xs={12} sm={4} md={5} lg={5}>
            <Text size={Text.Size.M}>{project.name}</Text>
          </Col>
          <Col xs={12} sm={4} md={4} lg={4}>
            <Row end="xs">
              <Col xs={12}>
                <Toggle
                  size={Size.Size14}
                  checked={project.finished || false}
                  onChange={() => onToggle(project.id)}
                  leftLabel="Finished:"
                  disabled={statuses[project.id] === "updating"}
                />
                {statuses[project.id] === "error" && (
                  <Text
                    size={Text.Size.S}
                    style={{
                      color: "var(--ring-error-color)",
                      marginTop: "0.25rem",
                    }}
                  >
                    Couldn't update the project
                  </Text>
                )}
                {statuses[project.id] === "updating" && (
                  <Text
                    size={Text.Size.S}
                    style={{
                      color: "var(--ring-secondary-color)",
                      marginTop: "0.25rem",
                    }}
                  >
                    Updating...
                  </Text>
                )}
              </Col>
            </Row>
          </Col>
        </Row>
      ))}
    </Grid>
  );
};
export default ProjectList;
