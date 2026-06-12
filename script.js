// ========== ГЛОБАЛЬНІ ЗМІННІ ==========
let currentUser = null;
let currentLang = localStorage.getItem('izunax_lang') || 'uk';
let unsubscribeFeed = null;
let unsubscribeChat = null;

// ========== ФУНКЦІЯ ПЕРЕКЛАДУ (локальна) ==========
function t(key) {
    const translations = window.translations?.[currentLang] || {};
    return translations[key] || key;
}

// ========== СЛІДКУВАННЯ ЗА КОРИСТУВАЧЕМ ==========
auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    if (user) {
        // Створюємо/оновлюємо документ користувача
        const userRef = db.collection("users").doc(user.uid);
        const doc = await userRef.get();
        if (!doc.exists) {
            await userRef.set({
                email: user.email,
                name: user.displayName || "Користувач",
                avatar: user.photoURL || "",
                bio: "",
                createdAt: new Date(),
                followers: [],
                following: []
            });
        }
        // Показуємо інтерфейс
        document.getElementById("heroSection")?.classList.add("hidden");
        document.getElementById("content")?.classList.remove("hidden");
        document.querySelector(".bottom-nav")?.classList.remove("hidden");
    } else {
        document.getElementById("heroSection")?.classList.remove("hidden");
        document.getElementById("content")?.classList.add("hidden");
        document.querySelector(".bottom-nav")?.classList.add("hidden");
    }
});

// ========== СТРІЧКА (real-time) ==========
function showFeed() {
    const content = document.getElementById("content");
    content.innerHTML = `<div class="container"><h2>${t('feed_title')}</h2>
        <button class="btn btn-primary" onclick="showCreatePost()">${t('feed_new_post')}</button>
        <div id="postsList" class="posts-grid"></div></div>`;
    
    if (unsubscribeFeed) unsubscribeFeed();
    unsubscribeFeed = db.collection("posts").orderBy("createdAt", "desc").onSnapshot(async (snapshot) => {
        const postsDiv = document.getElementById("postsList");
        if (!postsDiv) return;
        postsDiv.innerHTML = "";
        for (const doc of snapshot.docs) {
            const post = doc.data();
            const authorSnap = await db.collection("users").doc(post.userId).get();
            const author = authorSnap.data();
            const isLiked = currentUser && post.likes?.includes(currentUser.uid);
            postsDiv.innerHTML += `
                <div class="post-card" data-postid="${doc.id}">
                    <div class="post-author">
                        <img class="avatar" src="${author?.avatar || 'https://via.placeholder.com/40'}" onerror="this.src='https://via.placeholder.com/40'">
                        <b>${author?.name || "Користувач"}</b>
                    </div>
                    <p>${post.text || ""}</p>
                    ${post.imageUrl ? `<img class="post-image" src="${post.imageUrl}">` : ""}
                    <div class="post-actions">
                        <button class="like-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike('${doc.id}', this)">❤️ ${post.likes?.length || 0}</button>
                        <button onclick="showComments('${doc.id}')">💬 ${post.commentsCount || 0}</button>
                        ${currentUser && currentUser.uid === post.userId ? `<button class="btn-danger" onclick="deletePost('${doc.id}')">🗑️ ${t('post_delete')}</button>` : ''}
                    </div>
                    <small>${new Date(post.createdAt?.toDate()).toLocaleString()}</small>
                </div>`;
        }
        if (snapshot.empty) postsDiv.innerHTML = `<p>${t('feed_no_posts')}</p>`;
    });
}

// ========== ЛАЙКИ ==========
async function toggleLike(postId, btn) {
    if (!currentUser) return alert(t('msg_login_required'));
    const postRef = db.collection("posts").doc(postId);
    const post = await postRef.get();
    const likes = post.data().likes || [];
    if (likes.includes(currentUser.uid)) {
        await postRef.update({ likes: likes.filter(id => id !== currentUser.uid) });
        btn.classList.remove("liked");
    } else {
        await postRef.update({ likes: [...likes, currentUser.uid] });
        btn.classList.add("liked");
        // Сповіщення автору
        if (post.data().userId !== currentUser.uid) {
            await db.collection("notifications").add({
                userId: post.data().userId,
                type: "like",
                fromUserId: currentUser.uid,
                postId: postId,
                read: false,
                createdAt: new Date()
            });
        }
    }
}

// ========== ВИДАЛЕННЯ ПОСТУ (для автора) ==========
async function deletePost(postId) {
    if (!confirm(t('msg_confirm_delete'))) return;
    await db.collection("posts").doc(postId).delete();
    // Також видалити коментарі до цього поста
    const comments = await db.collection("comments").where("postId", "==", postId).get();
    comments.forEach(c => c.ref.delete());
}

// ========== КОМЕНТАРІ (з real-time) ==========
async function showComments(postId) {
    const content = document.getElementById("content");
    content.innerHTML = `<div class="container"><h2>${t('post_comments')}</h2><div id="commentsList"></div>
        <textarea id="commentText" placeholder="${t('chat_placeholder')}"></textarea>
        <button class="btn btn-primary" onclick="addComment('${postId}')">${t('chat_send')}</button>
        <button class="btn btn-secondary" onclick="showFeed()">${t('btn_cancel')}</button></div>`;
    
    db.collection("comments").where("postId", "==", postId).orderBy("createdAt", "desc").onSnapshot((snap) => {
        const container = document.getElementById("commentsList");
        if (!container) return;
        container.innerHTML = "";
        snap.forEach(doc => {
            const c = doc.data();
            container.innerHTML += `<div class="comment"><b>${c.authorName}:</b> ${c.text}<br><small>${new Date(c.createdAt?.toDate()).toLocaleString()}</small></div>`;
        });
    });
}

async function addComment(postId) {
    if (!currentUser) return alert(t('msg_login_required'));
    const text = document.getElementById("commentText").value;
    if (!text.trim()) return;
    await db.collection("comments").add({
        postId: postId,
        userId: currentUser.uid,
        authorName: currentUser.displayName || "Користувач",
        text: text,
        createdAt: new Date()
    });
    // Оновити лічильник коментарів у пості
    const postRef = db.collection("posts").doc(postId);
    const commentsSnap = await db.collection("comments").where("postId", "==", postId).get();
    await postRef.update({ commentsCount: commentsSnap.size });
    document.getElementById("commentText").value = "";
    // Сповіщення автору
    const post = await postRef.get();
    if (post.data().userId !== currentUser.uid) {
        await db.collection("notifications").add({
            userId: post.data().userId,
            type: "comment",
            fromUserId: currentUser.uid,
            postId: postId,
            read: false,
            createdAt: new Date()
        });
    }
}

// ========== ЧАТ (real-time) ==========
function showChat() {
    const content = document.getElementById("content");
    content.innerHTML = `<div class="container"><h2>${t('chat_title')}</h2>
        <div id="chatMessages" class="chat-messages"></div>
        <div class="chat-input"><input type="text" id="chatInput" placeholder="${t('chat_placeholder')}"><button class="btn btn-primary" onclick="sendChatMessage()">${t('chat_send')}</button></div></div>`;
    
    if (unsubscribeChat) unsubscribeChat();
    unsubscribeChat = db.collection("chat").orderBy("timestamp", "asc").onSnapshot((snap) => {
        const container = document.getElementById("chatMessages");
        if (!container) return;
        container.innerHTML = "";
        snap.forEach(doc => {
            const msg = doc.data();
            container.innerHTML += `<div class="chat-message"><b>${msg.authorName}:</b> ${msg.text}<br><small>${new Date(msg.timestamp?.toDate()).toLocaleString()}</small></div>`;
        });
        container.scrollTop = container.scrollHeight;
    });
}

async function sendChatMessage() {
    if (!currentUser) return alert(t('msg_login_required'));
    const input = document.getElementById("chatInput");
    if (!input.value.trim()) return;
    await db.collection("chat").add({
        userId: currentUser.uid,
        authorName: currentUser.displayName || "Користувач",
        text: input.value,
        timestamp: new Date()
    });
    input.value = "";
}

// ========== ПІДПИСКИ ==========
async function followUser(userId) {
    if (!currentUser) return;
    const currentUserRef = db.collection("users").doc(currentUser.uid);
    const targetUserRef = db.collection("users").doc(userId);
    const currentUserDoc = await currentUserRef.get();
    const following = currentUserDoc.data().following || [];
    if (!following.includes(userId)) {
        await currentUserRef.update({ following: [...following, userId] });
        await targetUserRef.update({ followers: firebase.firestore.FieldValue.arrayUnion(currentUser.uid) });
        // Сповіщення
        await db.collection("notifications").add({
            userId: userId,
            type: "follow",
            fromUserId: currentUser.uid,
            read: false,
            createdAt: new Date()
        });
    }
}

// ========== ПОШУК ==========
function searchSite() {
    const query = document.getElementById("searchInput").value.toLowerCase();
    if (!query) return;
    db.collection("users").where("name", ">=", query).where("name", "<=", query + "\uf8ff").get().then(snap => {
        let html = `<h3>Користувачі:</h3>`;
        snap.forEach(doc => {
            const u = doc.data();
            html += `<div>${u.name} (${u.email})</div>`;
        });
        document.getElementById("searchResults").innerHTML = html;
    });
}

// ========== РЕДАКТУВАННЯ ПРОФІЛЮ ==========
async function updateProfile() {
    const name = document.getElementById("profileName").value;
    const bio = document.getElementById("profileBio").value;
    const avatarFile = document.getElementById("profileAvatar").files[0];
    let avatarUrl = null;
    if (avatarFile) {
        const ref = storage.ref().child(`avatars/${currentUser.uid}`);
        await ref.put(avatarFile);
        avatarUrl = await ref.getDownloadURL();
    }
    const updateData = { name, bio };
    if (avatarUrl) updateData.avatar = avatarUrl;
    await db.collection("users").doc(currentUser.uid).update(updateData);
    alert(t('msg_saved'));
    showProfile();
}

// ========== ВІДОБРАЖЕННЯ ПРОФІЛЮ ==========
async function showProfile() {
    const userDoc = await db.collection("users").doc(currentUser.uid).get();
    const userData = userDoc.data();
    const content = document.getElementById("content");
    content.innerHTML = `<div class="container"><h2>${t('profile_title')}</h2>
        <img class="avatar-large" src="${userData?.avatar || 'https://via.placeholder.com/100'}">
        <p><strong>Email:</strong> ${currentUser.email}</p>
        <p><strong>${t('profile_name')}:</strong> <input type="text" id="profileName" value="${userData?.name || ''}"></p>
        <p><strong>${t('profile_bio')}:</strong> <textarea id="profileBio">${userData?.bio || ''}</textarea></p>
        <p><strong>${t('profile_avatar')}:</strong> <input type="file" id="profileAvatar" accept="image/*"></p>
        <button class="btn btn-primary" onclick="updateProfile()">${t('profile_save')}</button>
        <button class="btn btn-secondary" onclick="logout()">${t('profile_logout')}</button></div>`;
}

function logout() { auth.signOut(); window.location.reload(); }

// ========== СТВОРЕННЯ ПОСТУ ==========
function showCreatePost() {
    const content = document.getElementById("content");
    content.innerHTML = `<div class="container"><h2>${t('post_create')}</h2>
        <textarea id="postText" placeholder="${t('feed_post_text')}"></textarea>
        <input type="file" id="postImage" accept="image/*">
        <button class="btn btn-primary" onclick="publishPost()">${t('feed_publish')}</button>
        <button class="btn btn-secondary" onclick="showFeed()">${t('feed_cancel')}</button></div>`;
}

async function publishPost() {
    const text = document.getElementById("postText").value;
    const file = document.getElementById("postImage").files[0];
    let imageUrl = "";
    if (file) {
        const ref = storage.ref().child(`posts/${Date.now()}_${file.name}`);
        await ref.put(file);
        imageUrl = await ref.getDownloadURL();
    }
    await db.collection("posts").add({
        userId: currentUser.uid,
        text: text,
        imageUrl: imageUrl,
        createdAt: new Date(),
        likes: [],
        commentsCount: 0
    });
    alert(t('msg_saved'));
    showFeed();
}

// ========== СПОВІЩЕННЯ ==========
async function showNotifications() {
    const snap = await db.collection("notifications").where("userId", "==", currentUser.uid).where("read", "==", false).get();
    let html = `<div class="container"><h2>Сповіщення</h2>`;
    snap.forEach(doc => {
        const n = doc.data();
        html += `<div>${n.type} від ${n.fromUserId}</div>`;
    });
    html += `</div>`;
    document.getElementById("content").innerHTML = html;
}

// ========== ІНІЦІАЛІЗАЦІЯ ==========
document.addEventListener("DOMContentLoaded", () => {
    // Бургер-меню
    const burger = document.getElementById("burgerBtn");
    const mobileMenu = document.getElementById("mobileMenu");
    if (burger && mobileMenu) {
        burger.onclick = () => {
            mobileMenu.classList.toggle("show");
            burger.innerHTML = mobileMenu.classList.contains("show") ? "✕" : "☰";
        };
    }
    // Додаємо пошук у шапку (якщо немає)
    const nav = document.querySelector(".nav-links");
    if (nav && !document.getElementById("searchInput")) {
        const searchHtml = `<input type="text" id="searchInput" placeholder="🔍 Пошук..." onkeyup="searchSite()" style="background:#1e1e28; border:none; color:white; padding:5px 10px; border-radius:20px;">`;
        nav.insertAdjacentHTML("beforeend", searchHtml);
    }
});
