# Screen Recording Demo App

A web application for recording, submitting, and reviewing demo videos. Built with React, Firebase, and Google Drive API.

## Features

- Google Sign-In (restricted to @pursuit.org accounts)
- Screen recording with MediaRecorder API
- Self-evaluation form
- Google Drive integration for video storage
- Staff review interface
- Real-time status updates

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase project
- Google Cloud project with Drive API enabled

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd screen-recording-demo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_GOOGLE_DRIVE_CLIENT_ID=your_client_id
   VITE_GOOGLE_DRIVE_API_KEY=your_api_key
   VITE_GOOGLE_DRIVE_FOLDER_ID=your_folder_id
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Firebase Setup

1. Create a new Firebase project
2. Enable Authentication with Google provider
3. Create a Firestore database
4. Update security rules to restrict access
5. Add your domain to the authorized domains list

## Google Drive API Setup

1. Create a new Google Cloud project
2. Enable the Google Drive API
3. Create OAuth 2.0 credentials
4. Configure the OAuth consent screen
5. Add authorized JavaScript origins and redirect URIs
6. Create a shared folder in Google Drive for video submissions

## Project Structure

```
src/
  ├── components/         # Reusable UI components
  │   ├── auth/          # Authentication components
  │   ├── recorder/      # Screen recording components
  │   └── feedback/      # Feedback form components
  ├── pages/             # Page components
  │   ├── home/          # Home page
  │   ├── builder/       # Builder interface
  │   └── staff/         # Staff review interface
  ├── services/          # API and service integrations
  ├── contexts/          # React contexts
  ├── utils/             # Utility functions
  └── types/             # TypeScript type definitions
```

## Security Considerations

- All Firebase security rules should be properly configured
- Google Drive API access should be restricted to necessary scopes
- User authentication should be properly validated
- File uploads should be sanitized and validated

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 