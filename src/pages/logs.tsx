import Navbar from '@/components/Navbar';
import { User } from '@/types/db/User';
import jwt from 'jsonwebtoken';
import { GetServerSideProps } from 'next';
import { MdOutlineCancel } from 'react-icons/md';
import db from '../../db/db';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretdevtoken';

type FoodLog = {
  id: number;
  date: string;
  name: string;
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
};

type Props = {
  user: User;
  logsByDate: Record<string, FoodLog[]>;
  calorieGoal: number;
};

export default function Logs({ user, logsByDate, calorieGoal }: Props) {
  const localStorageItemsKey = `macro-tracker-items-${user?.email}`;
  const localStorageDateKey = `macro-tracker-saved-date-${user?.email}`;
  const handleDeleteLog = async (id: number) => {
    try {
      const response = await fetch(`/api/delete-log/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete log');
      }

      localStorage.removeItem(localStorageItemsKey);
      localStorage.removeItem(localStorageDateKey);

      // Optionally, you can refresh the page or update the state to reflect the deletion
      window.location.reload();
    } catch (error) {
      console.error('Error deleting log:', error);
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text p-4">
      <Navbar />
      <div className="max-w-2xl mx-auto bg-brand-surface rounded-xl p-4 shadow-md mt-6" style={{ backgroundColor: '#2c2c2c' }}>
        <h1 className="text-2xl font-bold text-center mb-6 text-brand-accent">📅 Daily Logs</h1>

        {Object.keys(logsByDate).length === 0 ? (
          <p className="text-center text-brand-muted">No logs found. Start tracking today!</p>
        ) : (
          Object.entries(logsByDate).map(([date, entries]) => {
            const totals = entries.reduce(
              (acc, item) => ({
                id: item.id,
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
                  <div className={`text-sm text-brand-muted text-right ${totals.calories > calorieGoal ? 'text-red-500' : 'text-green-600'}`}>
                    {totals.calories} cal<br />
                    {totals.protein.toFixed(1)}p · {totals.carbs.toFixed(1)}c · {totals.fat.toFixed(1)}f
                  </div>
                </div>
                <ul className="space-y-2">
                  {entries.map((log, i) => (
                    <li
                      key={i}
                      className="flex justify-between items-center border-b border-gray-700 text-xs"
                    >
                      <span>{log.name}</span>
                      <span className="text-xs text-brand-muted text-right whitespace-nowrap flex items-center gap-1">
                        {log.calories ?? '?'} cal · {log.protein ?? '?'}p · {log.carbs ?? '?'}c · {log.fat ?? '?'}f{' '}
                        <MdOutlineCancel className="cursor-pointer text-gray-500 hover:text-red-700" size={8} onClick={() => handleDeleteLog(log.id)} />
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
  const token = req.cookies?.macroAIToken;
  if (!token) {
    return { redirect: { destination: '/', permanent: false } };
  }

  try {
    const user = jwt.verify(token, JWT_SECRET) as User;
    if (!user) {
      return { redirect: { destination: '/', permanent: false } };
    }

    const calorieGoal = user.calorie_goal;
    const rows = db
      .prepare(
        `SELECT id, date, name, calories, protein, fat, carbs
         FROM food_logs
         WHERE user_id = ?
         ORDER BY created_at DESC`
      )
      .all(user.id) as FoodLog[];

    const logsByDate: Record<string, FoodLog[]> = {};
    for (const row of rows) {
      if (!logsByDate[row.date]) logsByDate[row.date] = [];
      logsByDate[row.date].push(row);
    }

    return { props: { user, logsByDate, calorieGoal } };
  } catch (err) {
    console.log(err);

    return { redirect: { destination: '/', permanent: false } };
  }
};
