# H Archives — E2E Test Plan

## Environment
- **Preview URL**: https://deploy-preview-9--izunax.netlify.app
- **Testing scope**: Full UI/visual verification of the complete H Archives overhaul
- **Auth constraint**: No test Firebase credentials available; will test form validation and error handling, not successful login flow

---

## Test 1: Landing Page Boot Animation & Layout

**What it proves**: The boot screen renders and transitions to the main content correctly.

**Steps**:
1. Open preview URL in a fresh browser session (clear sessionStorage first via devtools)
2. Observe the boot screen with "H" logo and terminal-style lines appearing one by one
3. Wait for boot to complete (~2-3s) and main content to fade in

**Pass criteria**:
- Boot screen visible with dark background and red "H" logo with glitch effect
- Terminal boot lines appear sequentially (should see "[OK]" prefixed lines)
- After completion, boot screen fades out and reveals: header with "H ARCHIVES" brand, hero section with "H ARCHIVES" title, CTA buttons ("Открыть архив", "Терминал доступа", "Авторизация"), stats grid, features section, archive sections grid, quick terminal
- Scanlines/noise overlay visible across the page
- Footer text "H ARCHIVES © ОРГАНИЗАЦИЯ Н" visible

**Fail criteria**: Boot screen stuck/blank, main content never appears, missing sections, JS errors in console, no visual effects (no scanlines/noise)

---

## Test 2: Navigation — All Pages Load Without Errors

**What it proves**: All 14 HTML pages are deployed and linked correctly with no 404s.

**Steps**:
1. From landing page, click "Открыть архив" → should load archive.html
2. Click nav link "Документы" → documents.html
3. Click nav link "Досье" → dossiers.html  
4. Click nav link "Аномалии" → anomalies.html
5. Click nav link "Терминал" → terminal.html
6. Click nav link "Поиск" → search.html
7. Navigate directly to photos.html, incidents.html, operations.html, personnel.html, timeline.html, admin.html, profile.html, login.html

**Pass criteria**:
- Each page loads with dark background, header with H ARCHIVES branding, and appropriate content
- No 404 errors, no blank pages
- Header navigation is consistent across all pages
- Active nav link is highlighted on the current page

**Fail criteria**: Any page returns 404, blank page, missing header/footer, broken layout

---

## Test 3: Login Page — Form Validation & Tab Switching

**What it proves**: Auth UI is functional with proper validation and tab switching.

**Steps**:
1. Navigate to login.html
2. Verify "Вход" tab is active by default with email/password fields visible
3. Click "Регистрация" tab
4. Verify registration form appears with 4 fields: Позывной, Email, Пароль, Подтверждение пароля
5. Fill in registration form with mismatched passwords and submit
6. Verify error message "Пароли не совпадают" appears in red error box
7. Switch back to "Вход" tab
8. Submit empty login form
9. Verify browser validation prevents submission (required field)
10. Enter invalid email "test@test.com" and password "wrong" and submit
11. Verify Firebase error message appears (e.g. "Пользователь не найден" or "Неверные учётные данные")

**Pass criteria**:
- Tab switching works (Вход ↔ Регистрация), correct form shown for each
- Password mismatch shows "Пароли не совпадают" in red msg-box
- Empty form submission blocked by browser required validation
- Invalid credentials show Russian error message (not raw Firebase error code)
- Google login button visible with Google logo SVG

**Fail criteria**: Tabs don't switch, error messages don't appear, raw English Firebase errors shown, forms not validating

---

## Test 4: Terminal Page — Connection Animation & Commands

**What it proves**: Terminal is interactive with working command execution.

**Steps**:
1. Navigate to terminal.html
2. Observe connection animation (progress bar filling, status messages cycling)
3. After animation completes, verify terminal interface appears with welcome banner
4. Type "help" and press Enter
5. Verify command grid appears with at least: help, search, stats, list, goto, about, whoami, clear, date, exit
6. Type "about" and press Enter
7. Verify output contains "ОРГАНИЗАЦИЯ Н"
8. Type "date" and press Enter
9. Verify current date/time is shown in Russian locale format
10. Type "clear" and press Enter
11. Verify terminal body is cleared
12. Type "invalidcmd" and press Enter
13. Verify error message "Неизвестная команда: invalidcmd" appears

**Pass criteria**:
- Connection animation shows progress bar and rotating status messages in Russian
- Terminal appears after animation with H-ARCHIVES banner
- "help" shows command list grid
- "about" outputs text containing "ОРГАНИЗАЦИЯ Н"
- "date" outputs today's date
- "clear" empties the terminal
- Unknown command shows Russian error with command name echoed back

**Fail criteria**: Animation stuck, terminal never appears, commands don't execute, output missing, English error messages

---

## Test 5: Archive Browser — Tabs, Filters & Empty States

**What it proves**: Archive page renders with functional tabs and filter controls.

**Steps**:
1. Navigate to archive.html
2. Verify title "Главный архив" is visible
3. Verify 8 section tabs are visible: Документы, Фотоархив, Досье, Аномалии, Инциденты, Операции, Персонал, Хронология
4. Verify "Документы" tab is active (highlighted) by default
5. Verify filter bar has: search input, clearance level dropdown (6 options), status dropdown (5 options)
6. Click "Досье" tab
7. Verify "Досье" tab becomes active (previous tab deactivates)
8. Verify grid shows empty state or data cards (depending on Firestore content)

**Pass criteria**:
- Page title "Главный архив" displayed
- All 8 tabs visible and clickable
- Default tab "Документы" highlighted
- Clicking another tab changes active state
- Filter controls present with correct options in Russian
- Empty state shows "Материалы не найдены" icon if no data

**Fail criteria**: Missing tabs, tabs don't switch, filters missing, JS errors preventing render

---

## Test 6: Admin Page — Access Restriction Gate

**What it proves**: Admin panel correctly restricts access for non-authenticated users.

**Steps**:
1. Navigate to admin.html (while not logged in)
2. Verify "ДОСТУП ОГРАНИЧЕН" heading is visible
3. Verify message about organizer access (clearance level 4+)
4. Verify "Авторизоваться" button links to login.html
5. Verify the admin panel table/controls are NOT visible

**Pass criteria**:
- "ДОСТУП ОГРАНИЧЕН" text displayed prominently
- Explanation text about organizer role requirement visible
- Login button present and clickable
- No admin controls (table, create button, tabs) visible to unauthenticated user

**Fail criteria**: Admin panel visible without auth, access denied message missing, login link broken

---

## Test 7: Responsive Design — Mobile Viewport

**What it proves**: Layout adapts correctly for mobile screens.

**Steps**:
1. On landing page, resize viewport to 375px width (mobile)
2. Verify burger menu icon appears, desktop nav hidden
3. Click burger menu
4. Verify mobile nav slides open with all links
5. Verify hero section stacks vertically, text is readable
6. Verify features grid collapses to single column
7. Verify archive sections grid adapts

**Pass criteria**:
- Burger menu visible at mobile width, desktop nav hidden
- Mobile nav opens with all navigation links
- Content stacks vertically, no horizontal overflow
- Text readable, buttons full-width or properly sized

**Fail criteria**: Content overflows, nav broken, text truncated, horizontal scroll appears
