export function upperCaseFirstLetter(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getPSTDateString(date: Date): string {
    return new Date(date).toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
}
