# Offline mode and syncing

Trade CRM can work without an internet connection. Some data is stored right on the device, so lists and detail pages open even without a connection, and new sales, payments, and refunds are never lost — they go into a queue and are sent to the server on their own as soon as the connection comes back.

> [!NOTE]
> Offline mode relies on data that was already downloaded earlier. If you open the app offline for the very first time, there's no data yet — you need to sync once while you have a connection.

## Where to check the connection status

The app header has a connection indicator — green when there's internet, red ("Offline") when there isn't. If there are unsent operations in the queue or a sync is running, a counter appears next to the indicator. Tap the indicator to open the **"Sync"** screen (`/sync`). You can also reach it from the profile menu.

## The "Sync" screen

### Connection and "Sync everything"

At the top of the screen you can see whether you're online or offline right now, and when offline data was last updated. The **"Sync everything"** button re-downloads everything needed to work offline: products, debtors, transactions, markets, sellers, and users (within what your role can see).

While downloading, progress is shown ("Downloaded X of Y"). You can stop the download with the **"Cancel"** button — whatever has already downloaded stays on the device.

> [!TIP]
> If the server temporarily limits the number of requests, the app will wait on its own and continue — the message shows how many seconds are left.

### Send queue

This shows every operation created offline that hasn't been sent to the server yet: new transactions, payments, and refunds. Each operation has a status:

| Status | What it means |
| --- | --- |
| Waiting to send | Created, but there's no connection yet |
| Sending… | Going to the server right now |
| Weak connection — retrying | Sending failed, retrying automatically |
| Not sent | The server rejected it — needs your attention |

While there's a connection, the queue sends itself, one operation at a time, in the order it was created. Resending is safe: the server won't run the same operation twice.

For an operation marked "Not sent", you'll see **"Retry"** and **"Remove"** buttons. Before removing one, keep in mind that if the connection dropped right as it was sending, the server may have already accepted it — check the transactions list before treating it as cancelled.

> [!IMPORTANT]
> If you log out while operations are still waiting in the queue, they're deleted from the device and never reach the server. The app warns you about this before you log out and shows how many operations are queued.

### What's stored on the device

This list shows how many records per section (transactions, debtors, products, categories, sellers, markets, users) are available offline, and how many there are in total. The newest records are kept; older ones only open with a connection.

### Device storage

Shows how much space the stored data takes up. The **"Clear stored data"** button removes it from the device — without internet, screens will be empty until you sync again. The queue of unsent operations isn't affected.

## Working without a connection

- Lists and detail pages that have already been synced open as usual.
- Data that isn't on the device yet shows a "This data hasn't been downloaded yet" hint with a link to the sync screen.
- You can create a sale, debt, payment, or refund while offline — it's queued and sent on its own once there's a connection.

> [!TIP]
> Before heading somewhere you know won't have internet, open the "Sync" screen and tap **"Sync everything"** while you still have a connection.
