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

  async updateProjectFinishedStatus(
    projectId: string,
    finished: boolean
  ): Promise<void> {
    try {
      console.log(`Updating project ${projectId} to finished: ${finished}`);

      // Step 1: Get or create the bundle FIRST
      const bundleId = await this.ensureBundle();
      console.log(`Using bundle ID: ${bundleId}`);

      // Step 2: Get or create the global custom field
      const fieldId = await this.ensureGlobalCustomField(bundleId);
      console.log(`Using field ID: ${fieldId}`);

      // Step 3: Attach field to project if not already attached
      const projectFieldId = await this.ensureProjectCustomField(
        projectId,
        fieldId,
        bundleId
      );
      console.log(`Using project field ID: ${projectFieldId}`);

      // Step 4: Get the correct value ID (Yes or No)
      const valueId = await this.getValueId(bundleId, finished ? "Yes" : "No");
      console.log(`Using value ID: ${valueId}`);

      // Step 5: Update the project's custom field value
      await this.host.fetchYouTrack(`admin/projects/${projectId}`, {
        method: "POST",
        body: JSON.stringify({
          customFields: [
            {
              $type: "EnumProjectCustomField",
              id: projectFieldId,
              value: { id: valueId },
            },
          ],
        }),
      });

      console.log(
        `Successfully updated project ${projectId} 'Finished' status to ${
          finished ? "Yes" : "No"
        }`
      );
    } catch (err: any) {
      console.error("Error updating project status:", err);
      throw new Error(
        `Failed to update project: ${err.message || "Unknown error"}`
      );
    }
  }

  private async ensureBundle(): Promise<string> {
    try {
      // Step 1: Get all enum bundles
      const bundles: any[] = await this.host.fetchYouTrack(
        `admin/customFieldSettings/bundles/enum?fields=id,name,values(id,name)`
      );

      console.log(`Found ${bundles.length} existing bundles`);

      // Step 2: Look for an existing bundle named "Finished States"
      let bundle = bundles.find((b: any) => b.name === "Finished States");

      if (!bundle) {
        console.log("Creating 'Finished States' bundle...");

        // Create bundle WITHOUT ?fields and WITHOUT $type
        bundle = await this.host.fetchYouTrack(
          "admin/customFieldSettings/bundles/enum",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: "Finished States",
              values: [], // start empty
            }),
          }
        );

        console.log("Bundle created:", bundle);
      } else {
        console.log("Found existing bundle:", bundle);
      }

      // Step 3: Ensure 'Yes' and 'No' values exist
      const values = bundle.values || [];

      if (!values.some((v: any) => v.name === "Yes")) {
        console.log("Adding 'Yes' value to bundle...");
        const yesValue = await this.host.fetchYouTrack(
          `admin/customFieldSettings/bundles/enum/${bundle.id}/values`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Yes" }),
          }
        );
        console.log("Added 'Yes' value:", yesValue);
      }

      if (!values.some((v: any) => v.name === "No")) {
        console.log("Adding 'No' value to bundle...");
        const noValue = await this.host.fetchYouTrack(
          `admin/customFieldSettings/bundles/enum/${bundle.id}/values`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "No" }),
          }
        );
        console.log("Added 'No' value:", noValue);
      }

      return bundle.id;
    } catch (err: any) {
      console.error("Error in ensureBundle:", err);
      throw new Error(`Failed to create/get bundle: ${err.message}`);
    }
  }

  private async ensureGlobalCustomField(bundleId: string): Promise<string> {
    try {
      // Check if field exists
      const existingFields: any[] = await this.host.fetchYouTrack(
        "admin/customFieldSettings/customFields?fields=id,name,fieldType(id)"
      );

      let field = existingFields.find((f: any) => f.name === "Finished");

      if (!field) {
        console.log("Creating global 'Finished' custom field...");

        // Create the field by referencing the bundle directly
        field = await this.host.fetchYouTrack(
          "admin/customFieldSettings/customFields?fields=id,name",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              $type: "CustomField",
              name: "Finished",
              fieldType: {
                id: bundleId,
              },
            }),
          }
        );
        console.log("Global custom field created:", field);
      } else {
        console.log("Found existing field:", field);
      }

      return field.id;
    } catch (err: any) {
      console.error("Error in ensureGlobalCustomField:", err);
      throw new Error(`Failed to create/get custom field: ${err.message}`);
    }
  }

  private async ensureProjectCustomField(
    projectId: string,
    fieldId: string,
    bundleId: string
  ): Promise<string> {
    try {
      // Check if field is already attached to project
      const projectFields: any[] = await this.host.fetchYouTrack(
        `admin/projects/${projectId}/customFields?fields=id,field(id,name),bundle(id)`
      );

      let projectField = projectFields.find(
        (pf: any) => pf.field?.name === "Finished"
      );

      if (!projectField) {
        console.log(`Attaching 'Finished' field to project ${projectId}...`);
        projectField = await this.host.fetchYouTrack(
          `admin/projects/${projectId}/customFields?fields=id,field(id,name)`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              $type: "EnumProjectCustomField",
              field: { id: fieldId },
              bundle: { id: bundleId },
            }),
          }
        );
        console.log("Field attached to project:", projectField);
      } else {
        console.log("Field already attached to project:", projectField);
      }

      return projectField.id;
    } catch (err: any) {
      console.error("Error in ensureProjectCustomField:", err);
      throw new Error(`Failed to attach field to project: ${err.message}`);
    }
  }

  private async getValueId(
    bundleId: string,
    valueName: string
  ): Promise<string> {
    try {
      const bundle: any = await this.host.fetchYouTrack(
        `admin/customFieldSettings/bundles/enum/${bundleId}?fields=id,values(id,name)`
      );

      const value = bundle.values?.find((v: any) => v.name === valueName);

      if (!value) {
        throw new Error(`Value '${valueName}' not found in bundle`);
      }

      return value.id;
    } catch (err: any) {
      console.error("Error in getValueId:", err);
      throw new Error(`Failed to get value ID: ${err.message}`);
    }
  }

  async ensureCustomField(): Promise<boolean> {
    console.log("Setup is now handled automatically when toggling");
    return true;
  }
}
