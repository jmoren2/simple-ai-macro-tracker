export function upperCaseFirstLetter(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getPSTDateString(date: Date): string {
    return new Date(date).toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
}

export function formatPSTDate() {
    const date = new Date();
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Los_Angeles',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).formatToParts(date);

    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
    return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}

export function clearLocalStorageItems(userEmail: string) {
    const localStorageItemsKey = `macro-tracker-items-${userEmail}`;
    const localStorageDateKey = `macro-tracker-saved-date-${userEmail}`;
    localStorage.removeItem(localStorageItemsKey);
    localStorage.removeItem(localStorageDateKey);
}
