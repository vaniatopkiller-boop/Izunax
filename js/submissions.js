import {
  db, storage,
  collection, query, orderBy, where, limit, getDocs, getDoc,
  addDoc, doc, setDoc, updateDoc, deleteDoc, serverTimestamp,
  ref, uploadBytes, getDownloadURL, increment, onSnapshot, Timestamp
} from "./firebase-config.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const POINTS_PER_APPROVAL = 10;
const RATE_LIMIT_MS = 60_000; // 1 submission per minute
const lastSubmitTime = {};

const CATEGORIES = [
  { id: "anomaly", name: "Аномалия" },
  { id: "incident", name: "Инцидент" },
  { id: "document", name: "Документ" },
  { id: "photo", name: "Фотоматериал" },
  { id: "operation", name: "Операция" },
  { id: "personnel", name: "Персонал" },
  { id: "other", name: "Другое" }
];

const REJECTION_TEMPLATES = [
  "Не соответствует тематике архива",
  "Недостаточно информации",
  "Дублирует существующую запись",
  "Содержит недостоверные данные",
  "Нарушает правила публикации"
];

// ---------- Submissions CRUD ----------

async function createSubmission(data, userId, userName) {
  if (lastSubmitTime[userId] && Date.now() - lastSubmitTime[userId] < RATE_LIMIT_MS) {
    throw new Error("Подождите минуту перед следующей отправкой");
  }
  const submission = {
    title: data.title,
    description: data.description,
    category: data.category || "other",
    tags: data.tags || [],
    mediaUrl: data.mediaUrl || "",
    mediaType: data.mediaType || "",
    status: "pending",
    authorId: userId,
    authorName: userName || "Аноним",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    reviewedBy: "",
    reviewedAt: null,
    rejectionReason: ""
  };
  const docRef = await addDoc(collection(db, "submissions"), submission);
  lastSubmitTime[userId] = Date.now();
  await createNotification(userId, "submit", "Ваш пост успешно отправлен на проверку", docRef.id);
  return { id: docRef.id, ...submission };
}

async function getSubmissions(status, limitCount = 50) {
  const constraints = [orderBy("createdAt", "desc")];
  if (status) constraints.push(where("status", "==", status));
  if (limitCount) constraints.push(limit(limitCount));
  const q = query(collection(db, "submissions"), ...constraints);
  const snap = await getDocs(q);
  const items = [];
  snap.forEach(d => items.push({ id: d.id, ...d.data() }));
  return items;
}

async function getUserSubmissions(userId) {
  const q = query(
    collection(db, "submissions"),
    where("authorId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  const items = [];
  snap.forEach(d => items.push({ id: d.id, ...d.data() }));
  return items;
}

async function approveSubmission(submissionId, adminId) {
  const subRef = doc(db, "submissions", submissionId);
  const snap = await getDoc(subRef);
  if (!snap.exists()) throw new Error("Публикация не найдена");
  const data = snap.data();
  await updateDoc(subRef, {
    status: "approved",
    reviewedBy: adminId,
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  await addReputationPoints(data.authorId, POINTS_PER_APPROVAL);
  await createNotification(
    data.authorId,
    "approved",
    `Ваш пост "${data.title}" одобрен и опубликован!`,
    submissionId
  );
}

async function rejectSubmission(submissionId, adminId, reason) {
  const subRef = doc(db, "submissions", submissionId);
  const snap = await getDoc(subRef);
  if (!snap.exists()) throw new Error("Публикация не найдена");
  const data = snap.data();
  await updateDoc(subRef, {
    status: "rejected",
    reviewedBy: adminId,
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    rejectionReason: reason || REJECTION_TEMPLATES[0]
  });
  await createNotification(
    data.authorId,
    "rejected",
    `Ваш пост "${data.title}" отклонён. Причина: ${reason || REJECTION_TEMPLATES[0]}`,
    submissionId
  );
}

async function editSubmission(submissionId, updates) {
  await updateDoc(doc(db, "submissions", submissionId), {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

async function deleteSubmission(submissionId) {
  await deleteDoc(doc(db, "submissions", submissionId));
}

// ---------- Media Upload ----------

function validateFile(file) {
  if (!file) throw new Error("Файл не выбран");
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Файл слишком большой. Максимум: ${MAX_FILE_SIZE / 1024 / 1024} МБ`);
  }
  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm"];
  if (!allowed.includes(file.type)) {
    throw new Error("Допустимые форматы: JPEG, PNG, GIF, WebP, MP4, WebM");
  }
}

async function uploadSubmissionMedia(file, userId) {
  validateFile(file);
  const ext = file.name.split(".").pop();
  const path = `submissions/${userId}/${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

// ---------- Reputation / Points ----------

async function addReputationPoints(userId, points) {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    reputation: increment(points),
    approvedPosts: increment(1)
  });
}

async function getUserReputation(userId) {
  const snap = await getDoc(doc(db, "users", userId));
  if (!snap.exists()) return { reputation: 0, approvedPosts: 0 };
  const data = snap.data();
  return {
    reputation: data.reputation || 0,
    approvedPosts: data.approvedPosts || 0
  };
}

// ---------- Notifications ----------

async function createNotification(userId, type, message, relatedId) {
  await addDoc(collection(db, "notifications"), {
    userId,
    type,
    message,
    relatedId: relatedId || "",
    read: false,
    createdAt: serverTimestamp()
  });
}

async function getNotifications(userId, limitCount = 20) {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  const items = [];
  snap.forEach(d => items.push({ id: d.id, ...d.data() }));
  return items;
}

async function markNotificationRead(notifId) {
  await updateDoc(doc(db, "notifications", notifId), { read: true });
}

async function markAllNotificationsRead(userId) {
  const notifs = await getNotifications(userId, 100);
  const unread = notifs.filter(n => !n.read);
  for (const n of unread) {
    await updateDoc(doc(db, "notifications", n.id), { read: true });
  }
}

async function getUnreadCount(userId) {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    where("read", "==", false)
  );
  const snap = await getDocs(q);
  return snap.size;
}

function onNotifications(userId, callback) {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(20)
  );
  return onSnapshot(q, (snap) => {
    const items = [];
    snap.forEach(d => items.push({ id: d.id, ...d.data() }));
    callback(items);
  });
}

// ---------- Pending count for admin badge ----------

async function getPendingCount() {
  const q = query(collection(db, "submissions"), where("status", "==", "pending"));
  const snap = await getDocs(q);
  return snap.size;
}

export {
  CATEGORIES, REJECTION_TEMPLATES, MAX_FILE_SIZE, POINTS_PER_APPROVAL,
  createSubmission, getSubmissions, getUserSubmissions,
  approveSubmission, rejectSubmission, editSubmission, deleteSubmission,
  uploadSubmissionMedia, validateFile,
  addReputationPoints, getUserReputation,
  createNotification, getNotifications, markNotificationRead,
  markAllNotificationsRead, getUnreadCount, onNotifications,
  getPendingCount
};
