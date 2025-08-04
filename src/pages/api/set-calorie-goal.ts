import { setCookie } from 'cookies-next';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const goal = parseInt(body.calorieGoal, 10);

  if (isNaN(goal) || goal <= 0) {
    return NextResponse.json({ error: 'Invalid calorie goal' }, { status: 400 });
  }

  // Set cookie via cookies-next using the `cookies()` adapter for app router
  setCookie('calorieGoal', goal.toString(), {
    cookies, // required in App Router API route
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return NextResponse.json({ success: true });
}
