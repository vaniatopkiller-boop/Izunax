import {
  auth, db, storage,
  GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, onAuthStateChanged,
  sendPasswordResetEmail, updateProfile,
  doc, getDoc, setDoc, serverTimestamp,
  isAdmin
} from "./firebase-config.js";

const AUTH_STATE_KEY = "h_archives_auth";

function saveLocalSession(user) {
  localStorage.setItem(AUTH_STATE_KEY, JSON.stringify({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    ts: Date.now()
  }));
}

function clearLocalSession() {
  localStorage.removeItem(AUTH_STATE_KEY);
}

function getLocalSession() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_STATE_KEY));
  } catch { return null; }
}

async function ensureUserProfile(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email.split("@")[0],
      photoURL: user.photoURL || "",
      role: isAdmin(user.email) ? "organizer" : "guest",
      clearanceLevel: isAdmin(user.email) ? 5 : 1,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    });
  } else {
    const updates = { lastLogin: serverTimestamp() };
    const data = snap.data();
    if (isAdmin(user.email) && data.role !== "organizer") {
      updates.role = "organizer";
      updates.clearanceLevel = 5;
    }
    await setDoc(ref, updates, { merge: true });
  }
  return (await getDoc(ref)).data();
}

async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

async function loginWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const profile = await ensureUserProfile(cred.user);
  saveLocalSession(cred.user);
  return { user: cred.user, profile };
}

async function registerWithEmail(email, password, displayName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  const profile = await ensureUserProfile(cred.user);
  saveLocalSession(cred.user);
  return { user: cred.user, profile };
}

async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const profile = await ensureUserProfile(result.user);
  saveLocalSession(result.user);
  return { user: result.user, profile };
}

async function logout() {
  await signOut(auth);
  clearLocalSession();
}

async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

function onAuthChange(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const profile = await ensureUserProfile(user);
      saveLocalSession(user);
      callback({ user, profile, loggedIn: true });
    } else {
      clearLocalSession();
      callback({ user: null, profile: null, loggedIn: false });
    }
  });
}

export {
  loginWithEmail, registerWithEmail, loginWithGoogle,
  logout, resetPassword, onAuthChange, getUserProfile,
  getLocalSession, ensureUserProfile
};
