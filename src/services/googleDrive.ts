import { auth } from './firebase';

// TODO: Replace with your Google Drive API credentials
const CLIENT_ID = 'YOUR_CLIENT_ID';
const API_KEY = 'YOUR_API_KEY';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let gapiLoaded = false;

const loadGapi = () => {
  return new Promise<void>((resolve, reject) => {
    if (gapiLoaded) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      gapi.load('client:auth2', () => {
        gapi.client
          .init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES,
          })
          .then(() => {
            gapiLoaded = true;
            resolve();
          })
          .catch(reject);
      });
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

export const uploadToDrive = async (file: Blob, fileName: string): Promise<string> => {
  try {
    await loadGapi();

    const metadata = {
      name: fileName,
      mimeType: 'video/webm',
      parents: ['YOUR_FOLDER_ID'], // TODO: Replace with your Google Drive folder ID
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await auth.currentUser?.getIdToken()}`,
      },
      body: form,
    });

    if (!response.ok) {
      throw new Error('Failed to upload to Google Drive');
    }

    const data = await response.json();
    return `https://drive.google.com/file/d/${data.id}/view`;
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw error;
  }
}; 