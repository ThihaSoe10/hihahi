# Hisho (飛翔) - Phase 2 Walkthrough: Firebase & Exam Login System

Welcome to Phase 2! This document explains how to set up the newly integrated Firebase features and how the exam login system operates.

## What was built?
1. **Firebase Integration**: Added Firebase Client SDK (for the frontend) and Admin SDK (for the secure server side).
2. **Firestore Security Rules**: Rules are prepared to lock down database access so candidates can only access their own exam documents.
3. **Exam Login Flow (`/exam`)**: A custom page that checks an Exam ID against Firestore. It ensures that used IDs cannot be re-entered.
4. **Admin ID Generator**: A script to generate random, secure Exam IDs.

---

## 1. Firebase Console Setup

To connect this project to a real database, you must set up Firebase:

1. **Create a Project**: Go to the [Firebase Console](https://console.firebase.google.com/) and click "Add project". Name it `hisho-exam` (or similar).
2. **Enable Firestore**: In your Firebase project, go to **Build > Firestore Database** and click "Create database". Choose a location (e.g., `asia-northeast1` for Japan) and start in **Production mode**.
3. **Register a Web App**: Go to Project Overview > Project Settings (gear icon) > General. Under "Your apps", click the **</>** icon to add a web app. Register the app.
4. **Copy Client Config**: After registering, you will see a `firebaseConfig` object. Keep this tab open.

---

## 2. Environment Variables Setup

You need to connect your local app to Firebase.

1. In the project root folder (`hisho`), copy the `.env.local.example` file and rename it to `.env.local`.
2. Fill in the **Client Configuration** variables using the `firebaseConfig` object from Step 1.
3. To get the **Admin SDK Configuration**:
   - In the Firebase Console, go to Project Settings > **Service accounts**.
   - Click **Generate new private key**.
   - Open the downloaded JSON file.
   - Copy `project_id`, `client_email`, and `private_key` from the JSON into your `.env.local` file under the respective `FIREBASE_` variables.

> [!CAUTION]
> Keep your `FIREBASE_PRIVATE_KEY` exactly as formatted in the JSON (including the `\n` characters) and **never** commit `.env.local` to GitHub.

---

## 3. Deploying Firestore Rules

To enforce security on your database:

1. Open your terminal in the project root.
2. If you don't have the Firebase CLI, install it: `npm install -g firebase-tools`
3. Login: `firebase login`
4. Initialize Firestore: `firebase init firestore` (select your created project).
5. Deploy the rules: `firebase deploy --only firestore:rules`

Alternatively, you can manually copy the contents of `firestore.rules` and paste it into the "Rules" tab in the Firestore Console.

---

## 4. How to Generate Exam IDs

To create new valid Exam IDs for candidates:

1. Open your terminal in the project root.
2. Run the generator script and specify how many IDs you need (e.g., to generate 5 IDs):
   ```bash
   npx ts-node scripts/generateExamIds.ts 5
   ```
3. The script will output randomly generated unique IDs (e.g., `HISHO-AB12-XY89`). Save these to send to your candidates!

---

## 5. Testing the System

1. Start your local server: `npm run dev`
2. Go to `http://localhost:3000/exam`.
3. Try entering an invalid ID. You should see an error.
4. Try entering one of the IDs you just generated. You should be directed to the Exam Session page.
5. If you check your Firestore console, that candidate's `status` will now be `in_progress`, and a new document will exist in the `examSubmissions` collection.

---

## What's Next?
In the next prompt, we will build out the actual exam experience on the placeholder page:
- Rendering the exam questions.
- Adding a strict countdown timer.
- Implementing an autosave feature that saves the candidate's answers directly to their `examSubmissions` document.
