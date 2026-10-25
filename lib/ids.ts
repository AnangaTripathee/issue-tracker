// Largest value a MySQL INT column (Issue.id, User.id) can hold. A larger
// number is a well-formed ID, but no row can ever have it.
export const MAX_DB_INT = 2_147_483_647;

// Turns a URL segment such as "42" into a number. The WHOLE string must be a
// positive whole number, so "1abc", "-1", "1.5", "01", "1e3" and "" all return null.
export function parseId(value: string): number | null {
    if (!/^[1-9][0-9]*$/.test(value)) return null;
    const id = Number(value);
    return Number.isSafeInteger(id) ? id : null;
}
