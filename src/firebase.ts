import { initializeApp } from 'firebase/app';
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
  query,
  where,
  setLogLevel
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

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

export { doc, collection, onSnapshot, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, enableIndexedDbPersistence };
