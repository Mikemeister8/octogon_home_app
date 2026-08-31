// Case- and accent-insensitive comparison key for food/ingredient names, so
// "Jamon" and "jamon" (or "JAMON") are treated as the same concept instead
// of silently creating a duplicate in the food database every time someone
// types it slightly differently.
export const normalizeName = (name: string): string =>
    name.trim().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
