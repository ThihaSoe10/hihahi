import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (err) {
    console.error("Failed to initialize Firebase Admin:", err);
    process.exit(1);
  }
}

const db = getFirestore();

function generateId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length));
    part2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `HISHO-${part1}-${part2}`;
}

async function main() {
  const args = process.argv.slice(2);
  const count = parseInt(args[0], 10);
  
  if (isNaN(count) || count <= 0) {
    console.error('Please provide a valid number of Exam IDs to generate.');
    console.error('Usage: npx ts-node scripts/generateExamIds.ts <count>');
    process.exit(1);
  }

  console.log(`Generating ${count} Exam IDs...`);
  
  const batch = db.batch();
  const generatedIds: string[] = [];
  let generatedCount = 0;

  // Pre-fetch all blacklisted IDs to avoid regenerating them
  const blacklistedSnap = await db.collection('blacklist').get();
  const blacklistedIds = new Set(blacklistedSnap.docs.map(d => d.data().examId));

  while (generatedCount < count) {
    const examId = generateId();
    
    if (blacklistedIds.has(examId)) {
      continue; // Skip blacklisted IDs
    }

    const docRef = db.collection('examCandidates').doc(examId);
    
    batch.set(docRef, {
      examId,
      status: 'unused',
      createdAt: FieldValue.serverTimestamp(),
    });
    
    generatedIds.push(examId);
    generatedCount++;
  }

  try {
    await batch.commit();
    console.log('\nSuccessfully generated and saved Exam IDs:');
    generatedIds.forEach((id) => console.log(`- ${id}`));
  } catch (error) {
    console.error('Error saving to Firestore:', error);
  }
}

main();
