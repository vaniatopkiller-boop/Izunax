// 🔥 IZUNAX - Firebase Config
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, GoogleAuthProvider, signInWithPopup, 
  signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, doc, getDoc, setDoc, updateDoc,
  serverTimestamp, collection, query, orderBy, 
  limit, getDocs, addDoc, deleteDoc,
  increment, arrayUnion, arrayRemove
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAY58C_0NckfmkNHLsoB_eeKPcsBuB-W04",
  authDomain: "izunax-c1707.firebaseapp.com",
  projectId: "izunax-c1707",
  storageBucket: "izunax-c1707.firebasestorage.app",
  messagingSenderId: "755797664743",
  appId: "1:755797664743:web:2eaeff896c9df27075d342",
  measurementId: "G-G3D298FR2T"
};

let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  console.log("✅ Firebase OK: izunax-c1707");
} catch(e) {
  console.error("❌ Firebase init error:", e);
}

export { 
  app, auth, db,
  GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
  collection, query, orderBy, limit, getDocs,
  addDoc, deleteDoc, increment, arrayUnion, arrayRemove
};
