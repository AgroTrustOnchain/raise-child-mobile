/**
 * Parse JWT token and extract claims
 * @param token - JWT token string
 * @returns Decoded JWT payload
 */
export const parseJWT = (token: string): any => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = parts[1];
    // Add padding if necessary
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    
    // Decode base64url to string using atob (available in React Native)
    const decoded = atob(padded);
    
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error parsing JWT:', error);
    throw new Error('Failed to parse JWT token');
  }
};

/**
 * Extract the 'sub' field from a JWT token
 * @param token - JWT token string
 * @returns The 'sub' (subject/user ID) claim
 */
export const getSubFromJWT = (token: string): string => {
  if (!token) {
    throw new Error('Token is null or undefined');
  }
  const payload = parseJWT(token);
  if (!payload.sub) {
    throw new Error('JWT does not contain sub claim');
  }
  return payload.sub;
};

/**
 * Get all claims from a JWT token
 * @param token - JWT token string
 * @returns All claims in the JWT payload
 */
export const getJWTClaims = (token: string) => {
  return parseJWT(token);
};
