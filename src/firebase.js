// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB06w8AvVUPebLsmv2yAylkU2o-7SDJjdg",
  authDomain: "github-profile-analyzer-82c1b.firebaseapp.com",
  projectId: "github-profile-analyzer-82c1b",
  storageBucket: "github-profile-analyzer-82c1b.firebasestorage.app",
  messagingSenderId: "47165787083",
  appId: "1:47165787083:web:769d0b36b3ae23cca2444e",
  measurementId: "G-YY6XRTR4BB",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const isBrowser = typeof window !== "undefined";
const analytics = isBrowser && firebaseConfig.measurementId ? getAnalytics(app) : null;
const auth = isBrowser ? getAuth(app) : null;

function ensureAuth() {
  if (!auth) {
    throw new Error("Firebase auth is only available in the browser.");
  }
  return auth;
}

export const signup = async (email, password) => {
  const currentAuth = ensureAuth();
  try {
    const userCredential = await createUserWithEmailAndPassword(
      currentAuth,
      email,
      password
    );
    console.log(userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.log(error.message);
    throw error;
  }
};

export const login = async (email, password) => {
  const currentAuth = ensureAuth();
  try {
    const userCredential = await signInWithEmailAndPassword(
      currentAuth,
      email,
      password
    );
    console.log(userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.log(error.message);
    throw error;
  }
};

export const logout = async () => {
  const currentAuth = ensureAuth();
  try {
    await signOut(currentAuth);
  } catch (error) {
    console.log(error.message);
    throw error;
  }
};

const provider = new GoogleAuthProvider();
export const signInWithGoogle = async () => {
  const currentAuth = ensureAuth();
  try {
    const result = await signInWithPopup(currentAuth, provider);
    console.log(result.user);
    return result.user;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const observeAuthState = (callback) => {
  const currentAuth = ensureAuth();
  return onAuthStateChanged(currentAuth, (user) => {
    if (user) {
      console.log("Logged In");
    } else {
      console.log("Not Logged In");
    }
    callback(user);
  });
};

export { app, analytics, auth };
