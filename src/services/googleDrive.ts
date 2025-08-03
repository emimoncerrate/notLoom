import { GoogleAuth } from 'google-auth-library';

// Google Drive API integration for video uploads
export class GoogleDriveService {
  private accessToken: string | null = null;

  constructor() {
    // Will be initialized with proper OAuth tokens
  }

  /**
   * Initialize with user's access token from Firebase Auth
   */
  async initialize(userAccessToken: string) {
    this.accessToken = userAccessToken;
    
    // Test the token with a simple API call
    try {
      console.log('🧪 Testing Google Drive API access...');
      const testResponse = await fetch(
        'https://www.googleapis.com/drive/v3/about?fields=user',
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );
      
      if (testResponse.ok) {
        const userInfo = await testResponse.json();
        console.log('✅ Drive API test successful. User:', userInfo.user?.emailAddress);
      } else {
        const error = await testResponse.text();
        console.error('❌ Drive API test failed:', error);
      }
    } catch (error) {
      console.error('❌ Drive API test error:', error);
    }
  }

  /**
   * Upload video file to Google Drive using resumable upload
   * @param videoBlob - The video blob to upload
   * @param metadata - File metadata (name, description, etc.)
   * @returns Promise with upload result
   */
  async uploadVideo(
    videoBlob: Blob, 
    metadata: {
      name: string;
      description?: string;
      mimeType?: string;
      folderId?: string;
    }
  ): Promise<{ id: string; name: string; webViewLink: string }> {
    if (!this.accessToken) {
      throw new Error('Google Drive not initialized. Please authenticate first.');
    }

    const fileName = metadata.name || `pursuit-demo-${Date.now()}.webm`;
    const mimeType = metadata.mimeType || 'video/webm';
    
    try {
      // Get or create Pursuit folder if no specific folder provided
      let folderId = metadata.folderId;
      if (!folderId) {
        console.log('📁 Creating/finding Pursuit Demos folder...');
        folderId = await this.createPursuitFolder();
        // If folder creation fails, continue without folder (upload to root)
        if (!folderId) {
          console.log('📁 Uploading to root folder instead');
        }
      }

      // Step 1: Create resumable upload session
      const resumableUrl = await this.createResumableSession({
        name: fileName,
        mimeType: mimeType,
        parents: folderId ? [folderId] : undefined,
        description: metadata.description,
      });

      // Step 2: Upload the actual file data
      const result = await this.uploadFileData(resumableUrl, videoBlob);
      
      console.log('✅ Video uploaded to Google Drive:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to upload to Google Drive:', error);
      throw error;
    }
  }

  /**
   * Create resumable upload session
   */
  private async createResumableSession(fileMetadata: any): Promise<string> {
    console.log('🔑 Using access token:', this.accessToken?.substring(0, 20) + '...');
    console.log('📝 File metadata:', fileMetadata);
    
    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,webViewLink',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fileMetadata),
      }
    );

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Create session failed:', error);
      throw new Error(`Failed to create upload session: ${error}`);
    }

    const location = response.headers.get('location');
    if (!location) {
      throw new Error('No upload URL returned from Google Drive');
    }

    console.log('✅ Got upload URL:', location);
    return location;
  }

  /**
   * Upload file data using resumable upload
   */
  private async uploadFileData(
    uploadUrl: string, 
    videoBlob: Blob
  ): Promise<{ id: string; name: string; webViewLink: string }> {
    const chunkSize = 16 * 1024 * 1024; // 16MB chunks
    const fileSize = videoBlob.size;
    
    let startByte = 0;
    
    while (startByte < fileSize) {
      const endByte = Math.min(startByte + chunkSize - 1, fileSize - 1);
      const chunk = videoBlob.slice(startByte, endByte + 1);
      
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Range': `bytes ${startByte}-${endByte}/${fileSize}`,
          'Content-Length': chunk.size.toString(),
        },
        body: chunk,
      });

      if (response.status === 200 || response.status === 201) {
        // Upload complete
        const result = await response.json();
        return result;
      } else if (response.status === 308) {
        // Continue uploading
        const range = response.headers.get('range');
        if (range) {
          const rangeMatch = range.match(/bytes=0-(\d+)/);
          if (rangeMatch) {
            startByte = parseInt(rangeMatch[1]) + 1;
            continue;
          }
        }
        startByte = endByte + 1;
      } else {
        const error = await response.text();
        throw new Error(`Upload failed: ${response.status} ${error}`);
      }
    }

    throw new Error('Upload completed but no result received');
  }

  /**
   * Create or get a folder for Pursuit videos
   */
  async createPursuitFolder(cohortName?: string): Promise<string | null> {
    if (!this.accessToken) {
      throw new Error('Google Drive not initialized');
    }

    const folderName = cohortName ? `Pursuit Demos - ${cohortName}` : 'Pursuit Demos';
    
    try {
      // First, check if folder already exists
      const searchResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(folderName)}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (searchResponse.ok) {
        const searchResult = await searchResponse.json();
        if (searchResult.files && searchResult.files.length > 0) {
          console.log(`📁 Found existing folder: ${folderName}`);
          return searchResult.files[0].id;
        }
      } else {
        console.warn('Search request failed:', await searchResponse.text());
      }

      // Create new folder
      console.log(`📁 Creating new folder: ${folderName}`);
      const createResponse = await fetch(
        'https://www.googleapis.com/drive/v3/files?fields=id',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
          }),
        }
      );

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error('Failed to create folder:', errorText);
        console.warn('📁 Continuing without folder - uploading to root');
        return null; // Return null instead of throwing
      }

      const folder = await createResponse.json();
      console.log(`✅ Created folder: ${folderName} (${folder.id})`);
      return folder.id;
    } catch (error) {
      console.error('Error with folder operations:', error);
      console.warn('📁 Continuing without folder - uploading to root');
      return null; // Return null on any error
    }
  }

  /**
   * List files in a folder
   */
  async listVideos(folderId?: string): Promise<any[]> {
    if (!this.accessToken) {
      throw new Error('Google Drive not initialized');
    }

    let query = "mimeType contains 'video/' and trashed=false";
    if (folderId) {
      query += ` and '${folderId}' in parents`;
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink,createdTime,size,mimeType)&orderBy=createdTime desc`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to list videos');
    }

    const result = await response.json();
    return result.files || [];
  }

  /**
   * Get upload progress (for UI progress bars)
   */
  getUploadProgress(bytesUploaded: number, totalBytes: number): number {
    return Math.round((bytesUploaded / totalBytes) * 100);
  }
}

// Singleton instance
export const googleDriveService = new GoogleDriveService();