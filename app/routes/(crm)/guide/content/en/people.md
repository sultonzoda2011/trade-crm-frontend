# Sellers and users

Trade CRM provides two sections for managing staff and accounts:

- **"Sellers"** (`/sellers`) — store employees who handle sales. Available to **Administrators** and **Market Owners**.
- **"Users"** (`/users`) — the complete directory of all accounts across every role. Available only to **Administrators**.

## Sellers

At the top of **"Sellers"** there are two figures: **"To pay out"** (what you owe all sellers right now, disabled ones included) and **"Sold"** for the chosen period with the amount the sellers earned. Below are the **"Show"** chips (Active / Disabled / All) and **"Period"** chips (Today / Week / Month / Year). The period only changes "sold" and "earned"; **"To pay out"** is always all-time.

A seller row: name and sales for the period on the left, **what you owe them** and what they earned in the period on the right. Those owed the most come first. A yellow amount labelled **"overpaid"** means the seller was paid more than they earned (for example, after a refund) — the difference is deducted from the next markups.

On a phone, swipe a row **to the left** for **"Pay out"**, **"Disable"** (or **"Enable"**) and **"Edit"**.

### How to add or edit a seller

Tap **"Create seller"** (`/sellers/create`) and fill in:

- **"Image"** — the employee's photo;
- **"Full name"** `*`, **"Email"** `*` (the sign-in login), **"Phone"**;
- **"Market"** `*` — administrators only; for an owner the seller always joins their own market;
- **"Password"** `*` — at least 8 characters with a lowercase letter, an uppercase letter and a digit. The dice button generates one and shows it — pass it to the seller.

### The seller page

At the top: **"To pay out"** as the big figure and this month's numbers. Below:

- **"Balance"** — earned, minus refunds, paid out and the total. If part of the amount is still in debts customers have not paid, it is shown as its own line;
- **"Balance feed"** — every markup, refund, payout and cancelled payout in a row, newest first. The feed lines always add up to the balance;
- **"Transactions history"** — this seller's sales;
- **"Access"** — password reset and disabling.

### How to pay out

1. Tap **"Pay out"** (shown while the balance is above zero, disabled sellers included).
2. The amount is prefilled with the whole balance; you can leave part of it — the **"Remaining"** line shows how much stays.
3. Add a **"Note"** (for example "cash, for October") and confirm.

**Paid out by mistake?** Tap the payout in the feed and choose **"Cancel payout"**. Nothing is erased: both the payout and its cancellation stay in the feed, and the amount returns to "To pay out".

### Disable, reset password, delete

- **"Disable seller"** — they can no longer sign in, while sales, debts and balance stay. You can enable them back at any time. You cannot disable your own account.
- **"Reset password"** — the system creates a new password and shows it **once**. Copy it and pass it to the seller. If they are in the app at that moment, the old sign-in can keep working for up to 15 minutes.
- **"Delete"** (in the page header) — only while the seller has no sales and no payouts. With history there is no such button — disable the seller instead.

> [!NOTE]
> Payouts and cancellations need an internet connection, so the balance is always exact.

> [!TIP]
> To compare sellers' total revenue for a day, week, month or year, open **"Dashboard" → "Sellers"** tab.

## Users (for administrators)

The **"Users"** section (`/users`) gives administrators full control over accounts of every role:

| Role | Badge color | Responsibility |
| --- | --- | --- |
| **Administrator** | Purple | System-wide management of markets, users, catalog, and analytics |
| **Owner** | Amber | Full management of their own market, sellers, products, and sales |
| **Seller** | Blue | Recording credit sales, managing debtors, and viewing their market's catalog |

You can filter the users list by role, market, or owner. To add an account, click **"Create user"** (`/users/create`), choose the **"Role"** `*`, and enter **"Full Name"** `*`, **"Email"** `*`, and **"Password"** `*` (use the eye icon in the password field to reveal or hide what you typed).

> [!NOTE]
> To prevent accidental lockouts, the **"Delete"** button is automatically hidden on your own account row in both the table and mobile swipe actions.

## Access by role

| Action | Administrator | Owner | Seller |
| --- | --- | --- | --- |
| "Sellers" section (view, create, edit, delete) | Yes | Yes (own market) | No |
| Paying a seller, cancelling a payout, disabling and password reset | Yes | Yes | No |
| "Users" section (all roles) | Yes | No | No |
