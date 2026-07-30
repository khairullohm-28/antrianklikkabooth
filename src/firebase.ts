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
enableIndexedDbPersistence(db).catch(() => {});

export { doc, collection, onSnapshot, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, enableIndexedDbPersistence };
