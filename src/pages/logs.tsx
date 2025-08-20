import Navbar from '@/components/Navbar';
import { useFoodLogsByDay } from '@/hooks/useFoodLogsByDay';
import { User } from '@/types/db/User';
import { apiFetch } from '@/utils/api';
import { clearLocalStorageItems } from '@/utils/utils';
import { GetServerSideProps } from 'next';
import { MdOutlineCancel } from 'react-icons/md';

type Props = {
  user: User;
  calorieGoal: number;
  apiUrl: string;
};

export default function Logs({ user, calorieGoal, apiUrl }: Props) {
  const { logsByDate, fetchMore, hasMore, loading } = useFoodLogsByDay(apiUrl);
  const handleDeleteLog = async (id: number) => {
    try {
      const response = await apiFetch(`${apiUrl}/food/log/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete log');
      }
      clearLocalStorageItems(user.email);
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
        {
          hasMore && (
            <div className="flex justify-center">
              <button
                onClick={fetchMore}
                disabled={loading}
                className="mt-4 px-4 py-2 rounded cursor-pointer"
                style={{ backgroundColor: 'var(--accent)', color: 'white' }}
              >
                {loading ? "Loading..." : "Load More"}
              </button>
            </div>
          )
        }
      </div>
    </div>
  );
}


export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const apiUrl = process.env.SHTAI_API_URL;
  const meRes = await apiFetch(`${apiUrl}/user/me`, {
    headers: { cookie: req.headers.cookie ?? '' }
  });
  if (meRes.status !== 200) {
    return { redirect: { destination: '/', permanent: false } };
  }

  try {
    const user = await meRes.json() as User | null;
    console.log('User:', user);

    if (!user) {
      console.log('User not found');
      return { redirect: { destination: '/', permanent: false } };
    }

    return { props: { user, calorieGoal: user.calorie_goal, apiUrl } };
  } catch (err) {
    console.log(err);

    return { redirect: { destination: '/', permanent: false } };
  }
};
