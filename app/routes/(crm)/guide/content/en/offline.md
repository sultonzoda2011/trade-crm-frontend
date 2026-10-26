# Offline mode and syncing

Trade CRM is built to keep working even when your internet connection drops or becomes unstable. Downloaded lists and detail pages are stored right on your device, and new debtors, sales, credit transactions, payments, and refunds are never lost — they enter the send queue, appear in lists right away, and sync to the server automatically as soon as your connection returns.

> [!NOTE]
> Offline mode relies on data previously saved to your device. After signing in for the first time while online, tap **"Sync everything"** so your phone or computer is ready to work without a connection.

## Header status badge and quick sync button

On the right side of the top header bar sit a circular refresh button and a smart status badge:

- **When you are online and the queue is empty**, status badges stay hidden so the header remains clean. Only the circular refresh icon is shown — tap it anytime to trigger a background refresh right from the page you're on.
- **When something is happening or needs attention**, a status badge appears next to the refresh icon:
  - **"Downloading · X%"** (blue) — offline data is currently syncing;
  - **"X queued"** (gray) — operations are waiting to be sent;
  - **"Offline"** or **"Offline · X queued"** (red) — no connection; the app is running from device storage;
  - **"Errors: X"** (red) — the server rejected an operation and needs your decision.

Tapping any of these badges (or choosing **"Sync"** from the user menu or side navigation) opens the **"Sync"** screen (`/sync`).

## The "Sync" screen

The Sync screen is organized into four sections that give you full control over your connection, send queue, and local storage.

### 1. Connection status and "Sync everything"

The hero card at the top shows whether you are currently connected (**"Connected to the internet"** or **"No internet"**) and when your device data was last refreshed.

- The **"Sync everything"** button downloads the latest records across all sections available to your role.
- While downloading, a progress bar shows **"Downloaded X of Y"**. You can pause at any time with **"Stop"** — everything already downloaded stays saved on your device.
- When all sections are already fresh, the button reads **"Everything up to date"**; when offline, it reads **"No connection"**.

> [!TIP]
> If the server temporarily asks the app to slow down requests, a live countdown in seconds appears automatically and the download resumes on its own once the wait is over.

### 2. Send queue

This section lists every operation created while offline or on a weak connection: new debtors, sales, credit transactions, debt payments, and refunds.

| Status | What it means |
| --- | --- |
| **Waiting to send** | Created on the device and waiting for a connection or its turn in line |
| **Sending…** | Being sent to the server right now |
| **Weak connection — retrying (attempt X)** | The request dropped; the app is retrying automatically |
| **Not sent** | The server rejected the operation (the exact error message is shown in red below) |

Managing the queue:

- As long as you have internet, the queue sends itself **automatically** in the exact order operations were recorded. Retrying is completely safe: every operation carries a unique idempotency key, so the server will never duplicate a sale, debtor, or payment.
- In the section header you can use **"Send now"** (for waiting items when online) or **"Retry all"** (when any items have failed).
- Each individual item has **"Retry"** and **"Remove"** buttons. You can remove an item not only when it is marked **"Not sent"**, but also while it is still **"Waiting to send"** (before the first send attempt) if you change your mind or spot a mistake.

> [!IMPORTANT]
> If you try to sign out while unsent operations are still in the queue, the app warns you with a confirmation dialog. Choosing **"Sign out and delete"** permanently removes those unsent operations from the device before they reach the server.

### 3. Saved on this device (per-section sync)

This list shows all 7 data sections available to your role: **Transactions**, **Debtors**, **Products**, **Categories**, **Sellers**, **Markets**, and **Users**.

- Each row displays how many cards are saved locally out of the total (for example, **"45 of 100"**) along with a green checkmark when 100% of that section is cached.
- **Targeted refresh:** every row has its own **"Refresh"** icon button on the right. If you only need to update products or debtors, you can refresh just that single section without re-downloading the entire database. Sections updated within the last 5 minutes lock their refresh button briefly to avoid unnecessary data usage.

### 4. Device storage

Displays how much space local data uses (**"Used"** in KB/MB) and the number of **"Saved requests"**. The **"Clear saved data"** button (with confirmation) wipes cached pages from the device while **leaving the send queue untouched**, so unsent sales and payments are never lost.

## Everyday work without internet

- **No waiting on slow connections.** Even when you have a weak signal and the server takes more than a couple of seconds to respond, forms close immediately and finish sending in the background so you can keep working.
- **Instant visibility in lists.** Any debtor or transaction created offline appears at the top of its list right away with a **"Queued"** badge.
- **Give credit to a new offline debtor right away.** After creating a new debtor offline, you can immediately open the new transaction form, pick that debtor in the selection sheet, and record a credit sale for them.
- **Live balance and stock updates.** Queued payments, new debts, and refunds update displayed totals immediately, accompanied by a clear note (**"payment queued"**, **"new debt queued"**, or **"refund queued"**). Products sold offline are deducted from visible stock right away.
- **Offline selection sheets.** When choosing a product, debtor, seller, or category without internet, the picker sheet uses your saved local data and displays a helpful banner: *"Showing saved data — the list may be incomplete without internet"*.
- **Clear fallback for uncached items.** If you tap a record that was never downloaded to your device before going offline, you'll see **"This data hasn't been downloaded yet"** with an **"Open sync"** button instead of a broken page.
