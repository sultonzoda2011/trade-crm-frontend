# Sales and transactions

A transaction is a single deal: a sale for cash or card, a sale on credit, or a product refund. Everything involving money and goods goes through the **"Transactions"** section in the left-hand menu.

This section is the heart of the program. Here you record sales, mark payments against debts, and process refunds.

## How transactions are labeled

The program **does not show a transaction as a number** like "#1523" — a number tells you nothing. Instead you see **small product images** and a clear title: the name of the debtor or customer, or, if there is none, the type of deal.

> [!TIP]
> Hover over (or tap on a phone) the group of product images to see a list: which product and how many units.

## The transaction list

When you open the section you'll see a list of every deal. It has these columns:

| Column | What it shows |
| --- | --- |
| Products | Product images and the deal title |
| Debtor | The debtor's name (if a credit sale) |
| Customer | The customer's name, if one was recorded |
| Type | Sale, On credit, or Refund |
| Amount | The total amount of the deal |
| Status | Where the deal stands (see below) |

Some columns are hidden to keep the list uncluttered: **"Payment method"**, **"Balance"** and **"Created"**. Turn them on with the **"Columns"** button above the list.

### Search and filters

Above the list there is a search box and a filters button. You can filter by debtor, category, product, deal type, status, payment method, amount (from and to) and date. You can also choose the sort order — by date or by amount — and the direction (ascending or descending). By default the newest deals are shown on top.

Every active filter appears as a separate "pill" beneath the search — easy to remove one at a time.

### Deal types

| Type | Color | What it means |
| --- | --- | --- |
| Sale | Green | Goods sold and paid at once (cash or card) |
| On credit | Amber | Goods given on credit, payment expected later |
| Refund | Red | A refund of previously sold goods |

### Statuses

| Status | What it means |
| --- | --- |
| Active | The debt is open, no payments yet |
| Partial | The debt is partly paid, a balance remains |
| Paid | Paid in full |
| Partially refunded | Part of the goods were returned, the sale still stands |
| Refunded | The goods were returned in full |

### Actions in the list

The **"Create transaction"** button at the top opens the new-deal form. Next to each row are buttons: **"Record payment"** (available while a balance remains), **"View"** (open the details) and **"Delete"**. Deleting always asks for confirmation.

> [!NOTE]
> The "Record payment", "Delete" and refund buttons are available only to the administrator and the owner. A seller can create deals and view them, but does not process payments or refunds.

## How to record a sale or a credit

Press **"Create transaction"** and fill in the form.

1. **Add products.** For each product, select it in the **"Product"** field, enter the **"Quantity"**, and if needed a **"Discount"** and a **"Markup"**. The **"Total"** field is calculated for you as "price × quantity − discount + markup". Use **"+ Add product"** to add more lines.
2. Below each line you can see **how much stock is available**. If you enter more than there is, a red note "Not enough stock" appears — you won't be able to save.
3. On the right, in the **"Details"** block, choose the **"Type"** (Sale or On credit) and the **"Payment method"**. For a sale that is Cash or Card; for a credit it is Credit (set automatically). You may enter the customer's name.
4. If it is a **credit**, two more required fields appear: **"Debtor"** (who received the credit) and **"Due date"** (by when it must be repaid).
5. The **"Payment summary"** block shows the totals: **"Amount"**, **"Credited"** and **"Balance"**. For a sale the whole amount is credited at once — the deal becomes paid. For a credit, 0 is credited and the whole amount stays as the balance.
6. Press **"Create"**.

> [!IMPORTANT]
> Required fields are marked with an asterisk `*`: the product and quantity on each line, and for a credit also the debtor and the due date. Without them the deal cannot be saved.

> [!NOTE]
> A seller can only choose the **"On credit"** type. Recording an ordinary cash or card sale is done by the administrator and the owner.

On a phone a bar with the running total and the buttons is pinned to the bottom of the screen — always within reach as you scroll the form.

## The transaction page

Tap a row or the **"View"** button to open a deal's details. Everything is gathered here:

- The deal title with product images, its type and status, the creation date and (for a credit) the due date.
- The **"Products"** table — what was sold, at what price, how many, and how many have already been refunded.
- **"Payment history"** — every payment made, with amount, note, author and date.
- The **"Transaction totals"** block — sale amount, paid, discount, balance due, and, if there were refunds, the refunded and net amounts.
- The **"Timeline"** — a feed of the deal's events from oldest to newest: sale, credit issued, payments, refunds.
- If it is a credit sale — a block with the debtor and a link to their card.

## How to record a payment

Payments are made in parts — you don't have to pay the whole amount at once.

Press **"Record payment"** (in the list or on the deal page). A window opens with the remaining balance already filled in. Enter the **"Payment amount"**, add a **"Note"** if you like, and confirm.

With each payment the balance shrinks and the status changes on its own: **Active → Partial → Paid**. When the balance reaches zero the deal becomes "Paid" and the payment button goes dim.

## How to issue a refund

Press **"Issue refund"** on the deal page. In the refund window choose what you are returning:

- **"The entire remaining part"** — every not-yet-refunded unit is returned.
- **"Selected items"** — then for each product specify how many units are being returned (no more than allowed).

Enter the **"Reason for refund"** (for example, a defect or the wrong size) and confirm. The returned goods go back to stock automatically, and the sale amount is recalculated.

> [!TIP]
> A refund can be done in parts several times, until the units available for refund run out. Each refund is linked to the original sale — its page shows the full refund history.

## Who can do what

| Action | Administrator | Owner | Seller |
| --- | --- | --- | --- |
| View transactions | yes | yes | yes |
| Create a credit | yes | yes | yes |
| Record a sale (cash/card) | yes | yes | no |
| Record a payment | yes | yes | no |
| Issue a refund | yes | yes | no |
| Delete a transaction | yes | yes | no |
