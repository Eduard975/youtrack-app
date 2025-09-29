import { useEffect, useState } from "react";
import { PluginEndpointAPILayer } from "../../../../@types/globals";

export function useYouTrackHost() {
  const [host, setHost] = useState<PluginEndpointAPILayer | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof YTApp === "undefined") {
      console.error("YTApp is not defined");
      setError("YouTrack API not loaded");
      return;
    }

    YTApp.register()
      .then((registeredHost) => {
        console.log("YTApp registered successfully");
        setHost(registeredHost);
      })
      .catch((err) => {
        console.error("YTApp.register failed:", err);
        setError(`Registration failed: ${err.message}`);
      });
  }, []);

  return { host, error };
}
