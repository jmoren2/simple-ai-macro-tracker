export function upperCaseFirstLetter(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getPSTDateString(date: Date): string {
  return new Date(date).toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
}

export function formatPSTDate() {
  const date = new Date();
  const pstOffset = 8 * 60 * 60 * 1000; // PST is UTC-8
  const pstDate = new Date(date.getTime() - pstOffset);

  const yyyy = pstDate.getUTCFullYear();
  const mm = String(pstDate.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(pstDate.getUTCDate()).padStart(2, '0');
  const hh = String(pstDate.getUTCHours()).padStart(2, '0');
  const min = String(pstDate.getUTCMinutes()).padStart(2, '0');
  const sec = String(pstDate.getUTCSeconds()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${sec}`;
}

export function clearLocalStorageItems(userEmail: string) {
  const localStorageItemsKey = `macro-tracker-items-${userEmail}`;
  const localStorageDateKey = `macro-tracker-saved-date-${userEmail}`;
  localStorage.removeItem(localStorageItemsKey);
  localStorage.removeItem(localStorageDateKey);
}
