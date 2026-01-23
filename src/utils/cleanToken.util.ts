/**
 * Cleans a Supabase token by removing the appended query parameters.
 * Copied from Supabase often comes with &expires_at=... appended.
 * @param token The raw token string
 * @returns The cleaned JWT token
 */
export const cleanSupabaseToken = (token: string): string => {
    if (!token) return token;
    return token.split('&')[0];
};
