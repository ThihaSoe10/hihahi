# Cloudflare R2 Uploads Setup & Testing

This walkthrough details the steps required to configure Cloudflare R2 so the exam application can generate presigned URLs and upload files directly from the browser.

## 1. Cloudflare Dashboard Setup

### A. Create the Bucket
1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/) and navigate to **R2**.
2. Click **Create bucket**.
3. Name your bucket (e.g., `hisho-exam-submissions`) and choose **Automatic** location.
4. Click **Create bucket**.

### B. Generate API Tokens
To allow the Next.js backend to generate presigned URLs, you need S3 API credentials.
1. On the R2 dashboard, click **Manage R2 API Tokens** (top right).
2. Click **Create API token**.
3. Name it (e.g., `Hisho Exam Uploads`).
4. Under **Permissions**, select **Object Read & Write**.
5. Choose the specific bucket you just created under **Specify bucket(s)**.
6. Click **Create API Token**.
7. **Important**: Copy the `Access Key ID`, `Secret Access Key`, and your account ID (from the top right of the R2 dashboard) immediately. You will not be able to see the secret key again.

### C. Set the CORS Policy
Because the browser makes a direct `PUT` request to R2 (bypassing the Next.js server), R2 needs a CORS policy allowing the browser's origin.
1. Go to your newly created bucket in the Cloudflare R2 dashboard.
2. Click the **Settings** tab.
3. Scroll down to **CORS Policy** and click **Add CORS policy**.
4. Switch to the **JSON** editor and paste the following configuration EXACTLY:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-production-domain.com"
    ],
    "AllowedMethods": [
      "PUT",
      "GET"
    ],
    "AllowedHeaders": [
      "content-type"
    ],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3000
  }
]
```
> [!NOTE]
> Make sure to replace `https://your-production-domain.com` with your actual deployment URL later!

---

## 2. Environment Variables

Open the `.env.local` file in your project root and fill in the placeholder values we added:

```env
# Cloudflare R2 Configuration (S3-compatible)
R2_ACCOUNT_ID="your-cloudflare-account-id-here"
R2_ACCESS_KEY_ID="your-r2-access-key-here"
R2_SECRET_ACCESS_KEY="your-r2-secret-key-here"
R2_BUCKET_NAME="hisho-exam-submissions"
```
*(Your `R2_ACCOUNT_ID` is a 32-character hex string found on the R2 overview page.)*

---

## 3. End-to-End Testing

Once your environment variables are configured and the server is restarted (`npm run dev`), test the flow:

1. **Start an Exam Session**: Log in with a valid Exam ID to reach the form.
2. **Test File Validation**: 
   - Try uploading a `.exe` or a file larger than 20MB in Section B (Q16-20). You should see an immediate validation error in the UI.
   - Try uploading an image to the video section (Q21-22). You should see an invalid format error.
3. **Upload Success**:
   - Upload a valid `.js` file or a small `.mp4`. 
   - Watch the progress bar (it will be fast for small files).
   - Once complete, you should see "✓ Uploaded" and a box displaying the filename.
4. **Submission Blocker**:
   - While a large video is uploading, attempt to click the main "Submit" button at the bottom of the page. You should be blocked by an alert asking you to wait.
5. **Verify Firestore**:
   - After successfully submitting the exam, check the `examSubmissions` collection in Firebase.
   - The answers for the file questions should be stored as JSON strings containing the object key, filename, and original presigned URL.

> [!IMPORTANT]
> The next step will cover the Admin Review dashboard to view these submissions and deployment preparations!
