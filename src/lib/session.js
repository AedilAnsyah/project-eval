// Client-side Session Management

const SESSION_KEY = 'hmif_eval_user_session';

/**
 * Saves user details in the browser session.
 */
export function setSession(user) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }
}

/**
 * Retrieves the currently logged-in user, if any.
 */
export function getSession() {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(SESSION_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

/**
 * Clears the user session.
 */
export function clearSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}

/**
 * Checks if a user is logged in.
 */
export function isLoggedIn() {
  return !!getSession();
}

/**
 * Checks if the logged-in user is an admin.
 */
export function isAdmin() {
  const user = getSession();
  return user ? user.role === 'admin' : false;
}

/**
 * Checks if the logged-in user is a coordinator.
 */
export function isKoor() {
  const user = getSession();
  return user ? user.role === 'koor' : false;
}
