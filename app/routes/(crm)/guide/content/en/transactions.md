# Sales and transactions

A transaction is a single business operation: a cash or card sale, a credit sale (on debt), or a product refund. Everything involving goods and money flows through **"Transactions"** (`/transactions`). On a phone, you can also start a new transaction from anywhere using the raised **"+"** button in the center of the bottom navigation bar.

## How transactions are identified

Instead of cryptic numbers like "#1523", Trade CRM displays **small product thumbnails** alongside a meaningful title: the debtor's name, the customer's name, or the transaction type.

> [!TIP]
> Hover over (or tap on a phone) the group of product thumbnails in any row to see a quick breakdown of the exact items and quantities inside that transaction.

## Transactions list, filters, and mobile swipes

By default, the list displays these columns:

| Column | What it shows |
| --- | --- |
| **Products** | Product thumbnails and transaction title |
| **Debtor** | Debtor's name (for credit sales) |
| **Customer** | Customer's name, if recorded |
| **Type** | Sale, Debt, or Refund |
| **Total Amount** | Total transaction amount |
| **Status** | Current payment or refund state |

Use the **"Columns"** button to show optional columns: **"Payment Method"**, **"Remaining"**, **"Created By"**, and **"Created At"**.

### Search and filters

Above the list sit the search bar and the **"Filters"** button. You can filter transactions by:
- debtor, category, or specific product;
- **transaction type** (`Sale`, `Debt`, `Refund`) and **payment method** (`Cash`, `Card`, `Credit`);
- **status** (`Active`, `Partial`, `Paid`, `Partially refunded`, `Refunded`);
- **"Debt status"** (`Overdue`, `Due soon`, `Outstanding`, `Settled`) — great for pulling up all overdue or upcoming debts in one click;
- **"Created By"** seller filter (available to Administrators and Owners);
- total amount range (min/max) and date range.

### Swipe actions on mobile

On a phone, swipe any transaction row **to the left** (or long-press for half a second):
- **"Make Payment"** (green button) — appears on unpaid credit transactions (for Administrators and Owners);
- **"Delete"** (red button with confirmation).

> [!NOTE]
> Transactions do not have an "Edit" button: once recorded, a sale or debt cannot be altered retroactively. If a customer brings items back, record a **Refund**; when they pay down a balance, record a **Payment**.

### Transaction types and statuses

| Type / Status | What it means |
| --- | --- |
| **Sale** (green) | Goods sold and paid for immediately in cash or by card |
| **Debt** (amber) | Goods given on credit, with payment expected by the due date |
| **Refund** (red) | Return of previously sold goods |
| **Active** | Credit sale is open; no payments have been made yet |
| **Partial** | Partially paid; a remaining balance is still owed |
| **Paid** | Paid in full |
| **Partially refunded** | Some items were returned to stock; the rest of the sale stands |
| **Refunded** | All items in the transaction were returned |

## How to record a sale or a credit transaction

Click **"Create Transaction"** (or tap the center **"+"** button on your phone):

1. **Pick the payment mode at the top.** A segmented switch offers **"Cash"**, **"Card"**, or **"Debt"**. The app remembers your last choice for the next sale.
   - For **Sellers**, the mode is locked to **"Debt"**.
   - If you arrived via **"Give on credit"** from a debtor's profile, **"Debt"** mode and that debtor are pre-selected automatically.
2. **If recording a "Debt", choose the debtor and due date:**
   - Tap **"Debtor"** `*` to open the searchable debtor sheet. If the person isn't in your database yet, tap **"New debtor"** right inside the sheet to create them on the spot without losing your transaction draft.
   - Pick the **"Due date"** `*` from the calendar or tap one of the quick chips below the field: **`+7d`**, **`+14d`**, or **`+30d`**.
3. **Add products.** Tap the product field to open the searchable product sheet with photos, prices, and stock counts.
   - Adjust the quantity using the **`−` / `+`** stepper buttons or by typing a number. Available stock is shown right below each line.
   - To grant a customer discount or add a seller markup, tap **"Discount / Markup"** on the item card to reveal the optional **"Discount"** and **"Markup"** fields. The line total updates automatically (`price × quantity − discount + markup`).
   - Use **"+ Add product"** to add as many items as needed.
4. **Review and submit.** Check the total at the bottom and press the main action button: **"Complete sale"** for cash/card or **"Record debt"** for credit.

> [!TIP]
> You can record sales and debts **offline** too. The transaction immediately appears in the list with a **"Queued"** badge, deducts items from visible stock, and syncs to the server automatically when internet returns.

## Transaction detail page

Tapping any transaction opens its detail view (`/transactions/:id`), which includes:
- header with product thumbnails, type and status badges, dates, and action buttons (**"Make Payment"**, **"Refund"**, **"Delete"**);
- **"Products"** table — unit price, quantity sold, discount, markup, and returned quantity per line;
- **"Debtor"** card with a direct link to the debtor's profile;
- **"Payment History"** and **"Refund History"** with amounts, dates, staff names, and notes;
- **"Transaction Summary"** (total amount, paid, remaining balance, refunded amount, and net total);
- **"Timeline"** — a chronological feed of every event from creation through payments and refunds.

## How to record a debt payment

You can record a payment from the transactions list (or mobile swipe), from the transaction detail page via **"Make Payment"**, or directly from the debtor's profile via **"Accept payment"**.

In the payment modal:
1. Tap the **"Full remaining"** or **"Half"** quick chip, or type any partial payment amount.
2. Optionally add a **"Note"**.
3. Press **"Make Payment · [Amount] TJS"**.

The remaining balance drops immediately and the status updates automatically (**Active → Partial → Paid**).

## How to issue a refund

Open the transaction detail page and click **"Refund"**. In the **"Return items"** modal:
1. Choose what is being returned:
   - **"Everything still refundable"** — returns all remaining unreturned units;
   - **"Selected lines"** — lets you enter the exact returned quantity for each product line.
2. Enter the required **"Reason"** `*` (for example, defective item or wrong size).
3. Confirm the refund.

Returned items are added back to inventory automatically, transaction totals and debt balances are recalculated, and any seller markup on the returned units is proportionally reversed.

## Access by role

| Action | Administrator | Owner | Seller |
| --- | --- | --- | --- |
| View transactions list and details | Yes | Yes | Yes |
| Record a credit transaction ("Debt") | Yes | Yes | Yes |
| Record a direct sale (Cash / Card) | Yes | Yes | No |
| Record a debt payment | Yes | Yes | No |
| Issue a refund | Yes | Yes | No |
| Delete a transaction & filter by "Created By" | Yes | Yes | No |
