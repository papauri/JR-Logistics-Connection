import { getDriveAccessToken } from './driveAuth';

export const uploadFileToDrive = async (file: File): Promise<string> => {
  const token = getDriveAccessToken();
  if (!token) {
    throw new Error('Not authenticated with Google Drive. Please connect first.');
  }

  const metadata = {
    name: file.name,
    mimeType: file.type,
    // Note: To make the file viewable publicly for a website gallery, 
    // it's best to upload to a public folder or update permissions after uploading.
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: form
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error?.message || 'Failed to upload to Drive');
  }

  const data = await res.json();
  
  // Make the file publicly accessible so it works on a public website
  await fetch(`https://www.googleapis.com/drive/v3/files/${data.id}/permissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone'
    })
  });

  // Returns the webContentLink which can be used in <img> tags
  return data.webContentLink || data.webViewLink;
};
