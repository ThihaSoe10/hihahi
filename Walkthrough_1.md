# Hisho (飛翔) - Phase 1 Walkthrough

Welcome to the Hisho project! This document explains what was built in this first step and how you can run and modify the project.

## What was built?

1. **Next.js Foundation**: We set up a brand new Next.js 14 project using the modern App Router and TypeScript. 
2. **Tailwind CSS Styling**: The site is styled using a custom Tailwind theme that reflects a calm, trustworthy financial aesthetic. The custom Japanese-inspired colors (aizome, kurenai, matsu, washi, etc.) have been fully integrated.
3. **Internationalization (i18n)**: We installed and configured `next-intl`. The site defaults to Japanese, but you can seamlessly switch to English using the dropdown in the header. Your choice is remembered via a cookie!
4. **Marketing Pages**: We built the main landing page, including the Hero section, About/Mission statement, Launch Timeline, and E-commerce plans. 
5. **Responsive Design**: The layout automatically adjusts to look great on mobile phones, tablets, and desktop computers.

## How to run the project locally

To see the site in action on your own computer, open your terminal, navigate to this project folder, and run these two commands:

1. Install the dependencies (if you haven't already):
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

Once the server is running, open your web browser and go to [http://localhost:3000](http://localhost:3000).

## Where to edit the text (Japanese & English)

Since the site supports multiple languages, the text is not hard-coded into the pages. Instead, it lives in dedicated dictionary files. 

If you want to change any of the copy, open the `messages` folder in the project root:
- **Japanese text:** Edit `messages/ja.json`
- **English text:** Edit `messages/en.json`

Whenever you update these files, the changes will automatically reflect on the site.

## What's next?

In the next prompt, we will tackle the **Exam System**. We'll integrate **Firebase** for backend services and build a secure **exam login system**. This is why there is currently a placeholder link for "Exam" in the header!
