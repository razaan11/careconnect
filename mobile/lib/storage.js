// Thin AsyncStorage wrappers. Everything the app persists locally lives
// behind this module so screens never touch AsyncStorage keys directly.
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'careconnect_token';
const USER_KEY = 'careconnect_user';
const AVAILABILITY_KEY = 'careconnect_is_available';

export async function getToken() {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (err) {
    console.warn('[storage] getToken failed', err);
    return null;
  }
}

export async function setToken(token) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function removeToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function getUser() {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn('[storage] getUser failed', err);
    return null;
  }
}

export async function setUser(user) {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function removeUser() {
  await AsyncStorage.removeItem(USER_KEY);
}

// The API contract has no endpoint for toggling volunteer availability, so
// it is kept as a local-only preference rather than inventing a fake call.
export async function getIsAvailable() {
  try {
    const raw = await AsyncStorage.getItem(AVAILABILITY_KEY);
    return raw === null ? true : raw === 'true';
  } catch (err) {
    console.warn('[storage] getIsAvailable failed', err);
    return true;
  }
}

export async function setIsAvailable(value) {
  await AsyncStorage.setItem(AVAILABILITY_KEY, value ? 'true' : 'false');
}

export async function clearSession() {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}
