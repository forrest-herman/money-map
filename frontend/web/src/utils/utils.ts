/**
 * Converts an object of key-value pairs into a URL query string.
 *
 * @param {Record<string, any>} params - An object where keys are query parameter names and values are their corresponding values.
 *                                       Only keys with non-null and non-undefined values will be included.
 * @returns {string} A URL query string starting with "?", or "?" if no valid parameters are provided.
 *
 * @example
 * buildQueryString({ page: 1, search: 'test' });
 * // Returns: "?page=1&search=test"
 *
 * @example
 * buildQueryString({ page: 1, search: undefined });
 * // Returns: "?page=1"
 */
export const buildQueryString = (params: Record<string, any>) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
        }
    });
    return `?${searchParams.toString()}`;
};
