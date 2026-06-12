/**
 * Shared utility functions for H Archives.
 */

/* ─── DOM Helpers ─── */

function el(id) {
  return document.getElementById(id);
}

function show(id) {
  el(id).classList.remove('hidden');
}

function hide(id) {
  el(id).classList.add('hidden');
}

function toggleVisibility(id, visible) {
  el(id).classList.toggle('hidden', !visible);
}

/* ─── Event Helpers ─── */

function on(id, event, handler) {
  el(id).addEventListener(event, handler);
}

function onAll(selector, event, handler) {
  document.querySelectorAll(selector).forEach((node) =>
    node.addEventListener(event, handler)
  );
}

/**
 * Bind a toggle checkbox to a state key with a common side-effect.
 * @param {string} elementId - DOM id of the checkbox
 * @param {object} stateObj - Object whose property will be updated
 * @param {string} key - Property name on stateObj
 * @param {Function} afterChange - Callback invoked after state change
 */
function bindToggle(elementId, stateObj, key, afterChange) {
  on(elementId, 'change', (e) => {
    stateObj[key] = e.target.checked;
    afterChange();
  });
}

/* ─── Random Helpers ─── */

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pad(n, width = 3) {
  return String(n).padStart(width, '0');
}

function randomPaddedId(prefix, min, max, width = 3) {
  return `${prefix}${pad(randomInt(min, max), width)}`;
}

function randomDate(startYear = 2024, endYear = 2025) {
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 11, 31).getTime();
  const ts = start + Math.random() * (end - start);
  return new Date(ts).toLocaleDateString('uk-UA', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

/* ─── Format Helpers ─── */

function bytesToHuman(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ─── Notification Helper ─── */

function notify(message) {
  alert(message);
}
