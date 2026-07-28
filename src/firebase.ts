import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  getFirestore,
  enableIndexedDbPersistence,
  doc,
  collection,
  onSnapshot,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  setLogLevel
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Suppress internal Firestore WebChannel stream noise on transient reconnects
setLogLevel('error');

export const db =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

// Enable Firestore offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err?.code === 'failed-precondition') {
    console.info('Firestore offline persistence failed-precondition: multiple tabs open');
  } else if (err?.code === 'unimplemented') {
    console.info('Firestore offline persistence is not supported by this browser');
  } else {
    console.debug('Firestore offline persistence notice:', err?.message || err);
  }
});

// Attempt anonymous sign-in gracefully if enabled on the Firebase console
signInAnonymously(auth).catch((err) => {
  // auth/admin-restricted-operation occurs when Anonymous Auth is not enabled in Firebase Console.
  // Since Firestore rules allow public access, this is expected and safe to ignore.
  if (err?.code !== 'auth/admin-restricted-operation') {
    console.debug('Firebase anonymous auth info:', err?.message || err);
  }
});

export { doc, collection, onSnapshot, setDoc, getDoc, getDocs, updateDoc, deleteDoc };
