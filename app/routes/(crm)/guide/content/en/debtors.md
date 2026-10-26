# Debtors and payments

A debtor is a customer who buys goods on credit. The **"Debtors"** section (`/debtors`) brings together every credit customer, their current balance, their repayment risk score, and their complete history of purchases and payments.

> [!TIP]
> You can accept a payment or issue a new credit sale **directly from the debtor's profile** or **by swiping their row in the list** — there is no need to hunt through the transactions list manually.

## Debtors list, filters, and mobile swipes

The debtors table displays:

| Column | What it shows |
| --- | --- |
| **Name** | Debtor's name, avatar, and phone number |
| **Total debt amount** | How much they owe right now (or "No debt") |
| **Market** | Which market the debtor belongs to |

Use the **"Columns"** button to toggle optional columns: **"Transactions"** (deal count), **"Created at"**, and **"Updated at"**.

### Search, sorting, and filters

Above the list you can search by name or phone number, and open **"Filters"** to narrow down debtors by:
- **"Has active debts"** toggle;
- **"Has overdue debts"** toggle;
- **"Repayment risk"** level (`High risk`, `Medium risk`, `Low risk`);
- total debt amount range (min/max) and creation date range;
- sorting by creation date or alphabetically by name.

### Swipe actions on mobile

Swipe any debtor row **to the left** (or long-press for half a second) to reveal quick actions:
- **"Repay debt"** (green button) — opens the payment modal for their active debt (available to Administrators and Owners when the debtor has an unpaid debt);
- **"Edit"** (blue button) — update their name or phone number;
- **"Delete"** (red button with confirmation — for Administrators and Owners).

## How to add a debtor

You can create a debtor in two places:
1. Click **"Create debtor"** in the **"Debtors"** section.
2. Tap **"New debtor"** right inside the debtor selection sheet while recording a new credit transaction (`/transactions/create`).

The form has just two required fields (`*`):
- **"Full name"** `*` — the customer's name;
- **"Phone"** `*` — their contact phone number.

> [!NOTE]
> You don't enter a debt amount when creating a debtor: their balance is calculated automatically from credit transactions and payments. When offline, a newly created debtor appears immediately with a **"Queued"** badge and can be **selected in a new credit sale right away**.

## Debtor profile page

Opening a debtor (`/debtors/:id`) gives you their complete credit profile:

- **Profile header:** name, phone number, headline **"Current debt"** (along with **"Overdue"** amount and **"Longest overdue"** in days), and action buttons:
  - **"Accept payment"** — collect money toward an open debt right from the profile;
  - **"Give on credit"** — jump straight to the new transaction form with this debtor and credit mode pre-filled;
  - **"Edit"** and **"Delete"**.
- **Repayment and activity metrics:**

| Metric | What it means |
| --- | --- |
| **Active debts** | Number of currently unpaid credit transactions |
| **Next due date** | Nearest upcoming payment deadline |
| **Last payment** | Date of the debtor's most recent payment |
| **Last purchase** | Date of the most recent transaction with this customer |
| **Total lent** | Total value of goods given on credit over all time |
| **Total collected** | Total amount paid back so far |
| **Repayment rate** | Percentage of total credit that has been paid back |

### Repayment risk assessment

Trade CRM automatically evaluates each debtor's payment discipline and assigns a badge — **"Low risk"** (green), **"Medium risk"** (amber), or **"High risk"** (red) — along with a numerical **"Risk score: X of 13"**.

Under **"Why this risk"**, the card lists the exact reasons behind the rating in plain language (such as long overdue days, multiple open debts, or low repayment rate).

## How to accept a payment from a debtor

You can collect a debt payment straight from the debtor's profile (**"Accept payment"**), from the debtors list/swipe (**"Repay debt"**), or from an individual transaction page:

1. Tap **"Accept payment"** on the debtor's profile:
   - if the debtor has **one active debt**, the payment modal opens immediately;
   - if the debtor has **multiple active debts**, the **"Which debt to pay?"** bottom sheet opens, showing each unpaid transaction with its items, date, and remaining balance — tap the one you want to pay.
2. In the payment modal, tap **"Full remaining"** or **"Half"**, or enter a custom amount and optional **"Note"**.
3. Confirm with **"Make Payment · [Amount] TJS"**.

The debtor's total debt, transaction balance, and risk indicators update automatically (including when working offline).

## Access by role

| Action | Administrator | Owner | Seller |
| --- | --- | --- | --- |
| View debtors list and profiles | Yes | Yes | Yes |
| Create and edit debtors | Yes | Yes | Yes |
| "Give on credit" (record a new credit transaction) | Yes | Yes | Yes |
| Accept payment ("Accept payment" / "Repay debt") | Yes | Yes | No |
| Delete a debtor | Yes | Yes | No |
