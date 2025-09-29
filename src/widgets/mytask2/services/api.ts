import { PluginEndpointAPILayer } from "../../../../@types/globals";
import type { Project } from "../types/project";

export class YouTrackAPI {
  constructor(private host: PluginEndpointAPILayer) {}

  async getProjects(): Promise<Project[]> {
    const response = await this.host.fetchYouTrack(
      "admin/projects?fields=id,name,shortName,customFields(field(name),value(name))"
    );

    const projectsData: any = response;

    return projectsData.map((p: any) => {
      // Look for the finished custom field in project's custom fields
      const finishedField = p.customFields?.find(
        (cf: any) => cf.field?.name === "Finished"
      );
      return {
        id: p.id,
        name: p.name,
        shortName: p.shortName,
        finished: finishedField?.value?.name === "Yes" || false,
      };
    });
  }
}
