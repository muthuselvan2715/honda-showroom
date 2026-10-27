/**
 * Escape user text so it can be used safely inside a MongoDB $regex search.
 * Without this, characters like ( [ * + can crash a query or make it very slow.
 */
export const escapeRegex = (value = '') => String(value).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
