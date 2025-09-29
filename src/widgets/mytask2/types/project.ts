export interface Project {
  id: string;
  name: string;
  shortName: string;
  finished?: boolean;
}

export type ProjectStatus = "none" | "updating" | "error";
