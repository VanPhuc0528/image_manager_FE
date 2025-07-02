// hooks/useGooglePicker.ts
import { useEffect, useRef } from "react";

const CLIENT_ID = "1070318039881-53p11ea9cvllv03g594jg28t7br02kgv.apps.googleusercontent.com";
const DEVELOPER_KEY = "AIzaSyAqWGu8sO8GBBHZYjZ9tvdAjBD4JRptrYs";
const SCOPE = "https://www.googleapis.com/auth/drive.readonly";

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

let scriptsLoaded = false;

export const useGooglePicker = (onPicked: (files: any[]) => void) => {
  const accessTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (scriptsLoaded) return;

    const loadScripts = () => {
      const gapiScript = document.createElement("script");
      gapiScript.src = "https://apis.google.com/js/api.js";
      gapiScript.onload = () => {
        window.gapi.load("picker", () => {});
      };
      document.body.appendChild(gapiScript);

      const gisScript = document.createElement("script");
      gisScript.src = "https://accounts.google.com/gsi/client";
      document.body.appendChild(gisScript);
    };

    loadScripts();
    scriptsLoaded = true;
  }, []);

  const openPicker = () => {
    if (!accessTokenRef.current) {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        callback: (tokenResponse: any) => {
          if (tokenResponse?.access_token) {
            accessTokenRef.current = tokenResponse.access_token;
            showPicker(tokenResponse.access_token);
          } else {
            alert("❌ Không lấy được access_token từ Google.");
          }
        },
      });
      tokenClient.requestAccessToken();
    } else {
      showPicker(accessTokenRef.current);
    }
  };

  const showPicker = (accessToken: string) => {
    if (!window.google?.picker?.PickerBuilder) {
      alert("Google Picker chưa sẵn sàng!");
      return;
    }

    const view = new window.google.picker.View(window.google.picker.ViewId.DOCS_IMAGES);
    const picker = new window.google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(accessToken)
      .setDeveloperKey(DEVELOPER_KEY)
      .setCallback((data: any) => {
        if (data.action === window.google.picker.Action.PICKED) {
          onPicked(data.docs);
        }
      })
      .build();

    picker.setVisible(true);
  };

  return { openPicker };
};
