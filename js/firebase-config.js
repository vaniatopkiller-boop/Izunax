import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc,
  serverTimestamp, collection, query, orderBy, where,
  limit, getDocs, addDoc, increment, arrayUnion, arrayRemove,
  onSnapshot, Timestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  getStorage, ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAY58C_0NckfmkNHLsoB_eeKPcsBuB-W04",
  authDomain: "izunax-c1707.firebaseapp.com",
  projectId: "izunax-c1707",
  storageBucket: "izunax-c1707.firebasestorage.app",
  messagingSenderId: "755797664743",
  appId: "1:755797664743:web:2eaeff896c9df27075d342",
  measurementId: "G-G3D298FR2T"
};

let app, auth, db, storage;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (e) {
  console.error("Firebase init error:", e);
}

const ADMIN_EMAILS = ["vaniatopkiller@gmail.com"];

function isAdmin(email) {
  return ADMIN_EMAILS.includes(email);
}

export {
  app, auth, db, storage,
  GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, onAuthStateChanged,
  sendPasswordResetEmail, updateProfile,
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  serverTimestamp, collection, query, orderBy, where,
  limit, getDocs, addDoc, increment, arrayUnion, arrayRemove,
  onSnapshot, Timestamp,
  ref, uploadBytes, getDownloadURL, deleteObject,
  isAdmin
};
