import {
  db, storage,
  collection, query, orderBy, where, limit, getDocs, getDoc,
  addDoc, doc, setDoc, updateDoc, deleteDoc, serverTimestamp,
  ref, uploadBytes, getDownloadURL, deleteObject, Timestamp
} from "./firebase-config.js";

const COLLECTIONS = {
  documents: "archive_documents",
  photos: "archive_photos",
  dossiers: "archive_dossiers",
  anomalies: "archive_anomalies",
  incidents: "archive_incidents",
  operations: "archive_operations",
  personnel: "archive_personnel",
  timeline: "archive_timeline"
};

const CLEARANCE_LEVELS = {
  1: { name: "ОТКРЫТЫЙ", color: "#4caf50", code: "O-1" },
  2: { name: "ОГРАНИЧЕННЫЙ", color: "#ff9800", code: "O-2" },
  3: { name: "СЕКРЕТНЫЙ", color: "#f44336", code: "S-3" },
  4: { name: "СОВЕРШЕННО СЕКРЕТНЫЙ", color: "#9c27b0", code: "SS-4" },
  5: { name: "ОСОБОЙ ВАЖНОСТИ", color: "#e91e63", code: "OV-5" }
};

const STATUSES = {
  active: { name: "АКТИВНЫЙ", color: "#4caf50" },
  archived: { name: "В АРХИВЕ", color: "#ff9800" },
  classified: { name: "ЗАСЕКРЕЧЕН", color: "#f44336" },
  declassified: { name: "РАССЕКРЕЧЕН", color: "#2196f3" },
  neutralized: { name: "НЕЙТРАЛИЗОВАН", color: "#9e9e9e" }
};

function generateCode(prefix) {
  const num = String(Math.floor(Math.random() * 9000 + 1000));
  return `${prefix}-${num}`;
}

async function getItems(type, filters = {}) {
  const col = COLLECTIONS[type];
  if (!col) return [];
  let q = collection(db, col);
  const constraints = [orderBy("createdAt", "desc")];
  if (filters.clearance) constraints.push(where("clearanceLevel", "<=", filters.clearance));
  if (filters.status) constraints.push(where("status", "==", filters.status));
  if (filters.limit) constraints.push(limit(filters.limit));
  q = query(q, ...constraints);
  const snap = await getDocs(q);
  const items = [];
  snap.forEach(d => items.push({ id: d.id, ...d.data() }));
  return items;
}

async function getItem(type, id) {
  const col = COLLECTIONS[type];
  if (!col) return null;
  const snap = await getDoc(doc(db, col, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

async function createItem(type, data, userId) {
  const col = COLLECTIONS[type];
  if (!col) throw new Error("Unknown type");
  const prefix = type.substring(0, 3).toUpperCase();
  const item = {
    ...data,
    code: data.code || generateCode(prefix),
    clearanceLevel: data.clearanceLevel || 1,
    status: data.status || "active",
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    attachments: data.attachments || [],
    history: [{
      action: "created",
      by: userId,
      at: new Date().toISOString(),
      details: "Запись создана"
    }]
  };
  const docRef = await addDoc(collection(db, col), item);
  return { id: docRef.id, ...item };
}

async function updateItem(type, id, data, userId) {
  const col = COLLECTIONS[type];
  if (!col) throw new Error("Unknown type");
  const existing = await getItem(type, id);
  if (!existing) throw new Error("Item not found");
  const history = existing.history || [];
  history.push({
    action: "updated",
    by: userId,
    at: new Date().toISOString(),
    details: "Запись обновлена"
  });
  await updateDoc(doc(db, col, id), {
    ...data,
    updatedAt: serverTimestamp(),
    history
  });
}

async function deleteItem(type, id) {
  const col = COLLECTIONS[type];
  if (!col) throw new Error("Unknown type");
  await deleteDoc(doc(db, col, id));
}

async function uploadFile(file, path) {
  const storageRef = ref(storage, `archives/${path}/${Date.now()}_${file.name}`);
  const snap = await uploadBytes(storageRef, file);
  return await getDownloadURL(snap.ref);
}

async function searchArchive(queryStr, userClearance = 1) {
  const results = [];
  const q = queryStr.toLowerCase();
  for (const [type, colName] of Object.entries(COLLECTIONS)) {
    const snap = await getDocs(collection(db, colName));
    snap.forEach(d => {
      const data = d.data();
      if ((data.clearanceLevel || 1) > userClearance) return;
      const searchable = [data.title, data.description, data.code, data.body].filter(Boolean).join(" ").toLowerCase();
      if (searchable.includes(q)) {
        results.push({ id: d.id, type, ...data });
      }
    });
  }
  return results;
}

async function getStats() {
  const stats = {};
  for (const [type, colName] of Object.entries(COLLECTIONS)) {
    const snap = await getDocs(collection(db, colName));
    stats[type] = snap.size;
  }
  return stats;
}

export {
  COLLECTIONS, CLEARANCE_LEVELS, STATUSES,
  getItems, getItem, createItem, updateItem, deleteItem,
  uploadFile, searchArchive, getStats, generateCode
};
