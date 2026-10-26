# Sellers and users

Trade CRM provides two sections for managing staff and accounts:

- **"Sellers"** (`/sellers`) — store employees who handle sales. Available to **Administrators** and **Market Owners**.
- **"Users"** (`/users`) — the complete directory of all accounts across every role. Available only to **Administrators**.

## Sellers

The **"Sellers"** table shows:

| Column | What it shows |
| --- | --- |
| **Name** | Seller's avatar, full name, and email |
| **Email** | Sign-in address |
| **Market** | The market the seller is assigned to |

On a phone, swiping a seller row **to the left** reveals quick **"Edit"** and **"Delete"** buttons.

### How to add or edit a seller

Click **"Create seller"** (`/sellers/create`) and fill in:

- **"Image"** — staff photo;
- **"Full Name"** `*` — seller's name;
- **"Email"** `*` — sign-in email address;
- **"Password"** `*` — initial password (when editing an existing seller, the password field is optional: leave it blank to keep their current password, or type a new one to reset it).

### Markup balance and payout history

Whenever a seller adds a **"Markup"** (an extra amount above the base product price) on a transaction line, that markup accumulates in their personal balance. On the seller's detail page (`/sellers/:id`), the **"Markup Balance"** card tracks four figures:

| Metric | What it means |
| --- | --- |
| **Earned** | Total markup earned across all sales |
| **Reversed by refunds** | Markup deducted when customers returned items (shown when refunds have occurred) |
| **Already paid out** | Total amount paid out to the seller so far |
| **Available** | Current unpaid balance ready to be paid out |

### How to pay out a seller's markup

Whenever **"Available"** is greater than zero, a **"Pay out"** button appears in the seller's header:

1. Click **"Pay out"** to open the **"Pay out markup"** modal (the app refreshes the seller's latest balance from the server automatically when the modal opens).
2. Enter the **"Payment Amount"** `*` — you can pay out the entire available balance or just part of it (any remaining balance continues to accumulate).
3. Optionally add a **"Note"** and confirm.

Every payout is recorded in the **"Payout History"** list on the seller's page with its date, amount, and note.

> [!TIP]
> To compare sellers by overall sales volume for today, the week, the month, or the year, open **"Dashboard" → "Sellers" tab**.

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
| Pay out seller markup ("Pay out") & view payout history | Yes | Yes | No |
| "Users" section (all roles) | Yes | No | No |
