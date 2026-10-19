# Hisho (飛翔)

Next-generation trading software corporate site and internal exam portal.

## Tech Stack
- Next.js 14 (App Router)
- Tailwind CSS
- next-intl (i18n)
- Firebase (Firestore & Auth)
- Cloudflare R2 (S3-compatible blob storage)

## Environment Variables
To run this project, you will need the following environment variables. If deploying to Vercel, you must add these in the **Settings > Environment Variables** tab of your Vercel project before deploying.

### Firebase Client (Public)
Found in your Firebase Console under Project Settings > General > Your apps.
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Firebase Admin (Secret)
Generate a new private key from Firebase Console > Project Settings > Service Accounts.
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (Important: when pasting into Vercel, ensure the `\n` characters are properly formatted or paste the entire multiline string exactly as provided by Firebase).

### Cloudflare R2 (Secret)
Generated from the Cloudflare Dashboard > R2.
- `R2_ACCOUNT_ID` (Found on the R2 overview page right side)
- `R2_ACCESS_KEY_ID` (From an API token with Object Read & Write permissions)
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME` (e.g., `hisho-exam-submissions`)

## Deployment to Vercel

1. Push your code to a GitHub repository.
2. Log in to [Vercel](https://vercel.com) and click **Add New... > Project**.
3. Import your GitHub repository.
4. Open the **Environment Variables** accordion.
5. Copy all the variables listed above from your local `.env.local` file and paste them into Vercel. 
6. Click **Deploy**.
7. Once deployed, take your production domain (e.g., `https://hisho.vercel.app`) and add it to the **AllowedOrigins** in your Cloudflare R2 CORS policy!

## Generating Exam IDs
Run the following script locally to generate single-use exam IDs:
```bash
npx ts-node scripts/generateExamIds.ts <count>
```
These IDs are automatically saved to your production Firestore if your `.env.local` is configured.

## Admin Dashboard
Access the admin dashboard at `/admin`. You will need to manually create an admin account (Email/Password) in your Firebase Console under the **Authentication** tab.

## Design internship exam

The exam runs for 120 minutes from the moment the candidate accepts the rules. It contains 18 written questions, five Figma deliverables, and two videos. Figma deliverables accept PDF or PNG files up to 20 MB each. Videos accept MP4, MOV, or WebM files up to 500 MB each. The countdown locks the form and submits when it reaches zero; the server also rejects new drafts and upload URLs after the deadline.

For direct browser uploads, the R2 bucket must allow `PUT` from the website's exact origin. A CORS policy should include `PUT` in `AllowedMethods`, `Content-Type` in `AllowedHeaders`, and the production website origin in `AllowedOrigins`. Add the local development origin separately if local upload testing is needed. Confirm that the R2 account ID, bucket name, access key ID, and secret access key belong to the same account and that the token has object write permission. Test an MP4/MOV/WebM upload in the deployed app before inviting candidates.
