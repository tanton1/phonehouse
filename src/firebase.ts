import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyA2kbzG3Ll-yZmSAx2fE4Ff-jNkX4m3AMc",
  authDomain: "kythuat-6f66b.firebaseapp.com",
  projectId: "kythuat-6f66b",
  storageBucket: "kythuat-6f66b.firebasestorage.app",
  messagingSenderId: "370907799453",
  appId: "1:370907799453:web:28d7a20b7c05c0d6c75974",
  measurementId: "G-79HQH12YKX"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Enable offline persistence
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a a time.');
    } else if (err.code == 'unimplemented') {
      console.warn('The current browser does not support all of the features required to enable persistence');
    }
  });
}

export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
