import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authenticateSupabase } from '@/lib/auth-server';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'feedback.json');

if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
}

if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify([]));
}

function getFeedback() {
  const data = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(data);
}

function saveFeedback(feedback: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(feedback, null, 2));
}

export async function GET(request: NextRequest) {
  try {
    const feedback = getFeedback();
    return NextResponse.json(feedback);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateSupabase(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const body = await request.json();
    const { event_id, event_name, rating, comment } = body;

    if (!event_id || typeof rating !== 'number') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const feedbackList = getFeedback();

    // Check if user already submitted feedback for this event
    const existingIndex = feedbackList.findIndex((f: any) => f.event_id === event_id && f.user_id === authResult.user?.id);
    
    if (existingIndex > -1) {
      feedbackList[existingIndex] = {
        ...feedbackList[existingIndex],
        rating,
        comment,
        updated_at: new Date().toISOString()
      };
    } else {
      feedbackList.push({
        id: Date.now().toString(),
        event_id,
        event_name,
        user_id: authResult.user?.id || 'unknown',
        user_name: authResult.user?.name || 'Anonymous',
        rating,
        comment,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    saveFeedback(feedbackList);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error saving feedback:', error);
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
}
