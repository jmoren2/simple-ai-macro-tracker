import Navbar from '@/components/Navbar';
import { User } from '@/types/db/User';
import jwt from 'jsonwebtoken';
import { GetServerSideProps } from 'next';
import db from '../../db/db';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretdevtoken';

type FoodLog = {
  created_at: string;
  name: string;
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
};

type Props = {
  logsByDate: Record<string, FoodLog[]>;
  calorieGoal: number;
};

export default function Logs({ logsByDate, calorieGoal }: Props) {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text p-4">
      <Navbar />
      <div className="max-w-2xl mx-auto bg-brand-surface rounded-xl p-4 shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-brand-accent">📅 Daily Logs</h1>

        {Object.keys(logsByDate).length === 0 ? (
          <p className="text-center text-brand-muted">No logs found. Start tracking today!</p>
        ) : (
          Object.entries(logsByDate).map(([date, entries]) => {
            const totals = entries.reduce(
              (acc, item) => ({
                calories: acc.calories + (item.calories ?? 0),
                protein: acc.protein + (item.protein ?? 0),
                carbs: acc.carbs + (item.carbs ?? 0),
                fat: acc.fat + (item.fat ?? 0),
              }),
              { calories: 0, protein: 0, carbs: 0, fat: 0 }
            );

            return (
              <div key={date} className="mb-6">
                <div className="flex justify-between items-center border-b border-brand-muted pb-1 mb-2">
                  <h2 className="text-md font-semibold text-brand-accent">{date}</h2>
                  <div className={`text-sm text-brand-muted text-right ${totals.calories > calorieGoal ? 'text-red-500' : 'text-green-500'}`}>
                    {totals.calories} cal<br />
                    {totals.protein}p · {totals.carbs.toFixed(1)}c · {totals.fat.toFixed(1)}f
                  </div>
                </div>
                <ul className="space-y-2">
                  {entries.map((log, i) => (
                    <li
                      key={i}
                      className="flex justify-between items-center bg-brand-bg border border-brand-muted rounded px-3 py-2 text-sm"
                    >
                      <span>{log.name}</span>
                      <span className="text-xs text-brand-muted text-right whitespace-nowrap">
                        {log.calories ?? '?'} cal · {log.protein ?? '?'}p · {log.carbs ?? '?'}c · {log.fat ?? '?'}f
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const cookieHeader = req.headers.cookie;
  const token = cookieHeader?.match(/token=([^;]+)/)?.[1];

  if (!token) {
    return { redirect: { destination: '/', permanent: false } };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    const userId = decoded.id;

    //get user data
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User | undefined;
    if (!user) {
      return { redirect: { destination: '/', permanent: false } };
    }
    const calorieGoal = user.calorie_goal;

    const rows = db
      .prepare(
        `SELECT created_at, name, calories, protein, fat, carbs
         FROM food_logs
         WHERE user_id = ?
         ORDER BY created_at DESC`
      )
      .all(userId) as FoodLog[];

    const logsByDate: Record<string, FoodLog[]> = {};
    for (const row of rows) {
      const date = new Date(row.created_at).toISOString().split('T')[0]; // Format to YYYY-MM-DD
      if (!logsByDate[date]) logsByDate[date] = [];
      logsByDate[date].push(row);
    }

    return { props: { logsByDate, calorieGoal } };
  } catch (err) {
    console.log(err);

    return { redirect: { destination: '/', permanent: false } };
  }
};
