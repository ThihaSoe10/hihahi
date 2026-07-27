# Final Project Checklist & Walkthrough

Congratulations on completing the Hisho corporate site and exam portal! This walkthrough provides a comprehensive end-to-end checklist to ensure your production environment is fully configured and ready for real candidates.

---

## 1. Firebase Configuration

### A. Firestore Setup
1. Go to your Firebase Console and navigate to **Firestore Database**.
2. Ensure you have the following collections (they will be created automatically upon first write, but it's good to be aware):
   - `examCandidates`
   - `examSubmissions`
   - `blacklist`
3. Update your Firestore Security Rules to block all client-side access, as we are doing everything securely through server actions:
```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false; 
    }
  }
}
```

### B. Authentication Setup (Admin)
1. In the Firebase Console, go to **Authentication**.
2. Click **Get Started** and enable the **Email/Password** sign-in provider.
3. Go to the **Users** tab and click **Add User**.
4. Enter the email and password for your internal Admin account (e.g., `admin@hisho.com`). This is the *only* way to create admin accounts for this portal.

---

## 2. Cloudflare R2 Configuration

1. Create a bucket in the Cloudflare R2 dashboard (e.g., `hisho-exam-submissions`).
2. Generate an **R2 API Token** with **Object Read & Write** permissions for that specific bucket.
3. Configure the **CORS Policy** on the bucket to allow browser uploads from your local and production domains:
```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-production-vercel-domain.com"
    ],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedHeaders": ["content-type"],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3000
  }
]
```

---

## 3. Environment Variables

Ensure all the following environment variables are copied into your Vercel project settings (and your `.env.local` for local testing):

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`

---

## 4. Generating Exam IDs

Before you can test the exam flow, you must generate valid, single-use Exam IDs.
Run the script locally to generate 5 IDs:
```bash
npx ts-node scripts/generateExamIds.ts 5
```
Copy one of the generated `HISHO-XXXX-XXXX` IDs to use for your test run.

---

## 5. End-to-End Test Run

We highly recommend doing a full fake candidate run before distributing IDs.

### Phase 1: Candidate Experience
1. Start your local server (`npm run dev`) or visit your Vercel deployment.
2. Navigate to the `/exam` route.
3. Attempt to log in with an invalid ID to verify the error state.
4. Log in with the valid Exam ID you generated and enter a fake name (e.g., "Test Candidate").
5. Answer a few text questions in Section A.
6. Upload a text file in Section B and a small video in Section C. Verify the progress bars and "Uploaded" success states.
7. Wait 30 seconds to confirm the green "Autosaved" toast appears.
8. Click **Submit**. You should see the success completion screen.
9. Try to navigate back to `/exam` and log in with the *same* ID. You should be blocked with an "already used" error.

### Phase 2: Admin Experience
1. Navigate to `/admin`.
2. Log in using the Email/Password you created manually in the Firebase Console.
3. You should see "Test Candidate" in the left sidebar. Click on them.
4. Verify you can read their text answers.
5. Click **View / Download Attachment** on the file questions. It should open a new tab with the file served securely from Cloudflare R2 via a presigned URL.
6. Toggle the **AI Suspected** flag and add a note. Click **Save Notes**. *(Note: If you want automated AI-detection later, that would require integrating a third-party text/video analysis API and is not built in.)*
7. Finally, enter a reason and click **Blacklist Candidate**.
8. Go back to `/exam` and attempt to log in with that same ID again. It should now specifically say "This candidate has been blacklisted. Access denied."

> [!TIP]
> If everything above works perfectly, your platform is 100% ready for production!
