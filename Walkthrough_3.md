# Phase 3: The Exam Experience

The core exam functionality is now fully implemented! This phase introduces a strict environment designed for high-stakes assessment, featuring an ironclad timer, anti-cheat measures, and seamless autosaving.

## What Was Built

### 1. The Rules & Consent Screen
Before any timer starts, the candidate is presented with a detailed, localized Rules Screen. It explicitly states the conditions of the exam: the 1-hour limit, the prohibition of AI tools, and the grading criteria. The candidate must check an agreement box before proceeding.

### 2. Strict Timer Architecture
Clicking "Start Exam" triggers a Server Action that records the exact `startedAt` server timestamp in Firestore. 
The client-side timer calculates time remaining based on this **server-side timestamp**.
> [!NOTE]
> Because the timer relies on the server timestamp, it is completely immune to page refreshes, closed tabs, or local clock manipulation. If a candidate refreshes the page with 15 minutes left, they will return to the exact same 15-minute countdown. When the timer hits 0:00, the exam auto-submits.

### 3. Anti-Cheat Protections
We implemented an `AntiCheatWrapper` layout that covers the entire exam session.
- **Text Selection:** Disabled across the page via CSS (`user-select: none`).
- **Shortcuts Blocked:** Copy, cut, paste, and right-click context menus are intercepted and disabled via JavaScript event listeners.
- **Live Warnings:** If a candidate attempts a forbidden action, a bright red warning toast ("Copy/paste is disabled during this exam") temporarily appears at the top of the screen.

### 4. Continuous Autosave
To prevent data loss, the `ExamForm` uses a silent `setInterval` to autosave every 30 seconds.
- It batches all text answers and (for now) file placeholders and sends them to a Server Action.
- The Server Action updates the `answers` object in the candidate's `examSubmissions` Firestore document.
- A small, unobtrusive "Saved at [Time]" indicator appears in the corner, confirming to the candidate that their progress is safe.

### 5. Multi-Section Structure (22 Questions)
The exam seamlessly renders all 22 questions across three distinct sections:
- **Section A (Q1-15):** Textarea inputs for written answers.
- **Section B (Q16-20):** File upload inputs (`.txt, .js, .ts, .py, .java, .zip`) for coding tasks.
- **Section C (Q21-22):** Video upload inputs for the self-introduction and project presentation.

## Firestore State

At this stage, your `examSubmissions` documents will look like this:
```json
{
  "examId": "HISHO-A1B2-C3D4",
  "status": "completed", // or "in_progress"
  "startedAt": "August 25, 2026 at 10:00:00 AM UTC-7",
  "completedAt": "August 25, 2026 at 11:00:00 AM UTC-7",
  "answers": {
    "q1": "I am very familiar...",
    "q16": "[File selected: program.js]",
    "q21": "[File selected: intro.mp4]"
  },
  "lastSavedAt": "August 25, 2026 at 10:59:30 AM UTC-7"
}
```
*Note: Currently, file inputs simply record the filename as a placeholder string.*

## Next Steps
In the next phase, we will wire up the actual file uploads (Sections B & C). We will configure Cloudflare R2 to securely store the candidate's uploaded code files and videos, replacing the current placeholders with permanent URLs.
