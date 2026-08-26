# Debtors and payments

A debtor is a person you gave goods to on credit. The **"Debtors"** section in the left-hand menu gathers all such people, their debts, and their payment history.

> [!IMPORTANT]
> A debt payment is **not recorded here** — it is recorded on the deal itself. To take money from a debtor, open their credit transaction and press **"Record payment"**. How to do that is explained below, in "How to take a payment".

## What a debtor card is

When you sell goods on credit (see "Sales and transactions"), you specify who received them. That person is the debtor. Their card automatically gathers every debt and shows the **total amount**, how much has already been collected, whether anything is overdue, and how risky it is to keep extending them credit.

All amounts are calculated by the program from the debtor's deals — there is no need to enter a debt by hand.

## The debtor list

The list shows these columns:

| Column | What it shows |
| --- | --- |
| Name | The debtor's name, avatar and phone |
| Total debt | How much the person owes in total |
| Market | Which market the debtor belongs to |

Hidden columns (turned on with the **"Columns"** button): **"Transactions"** (how many deals they have), **"Created"** and **"Updated"**.

Above the list there is search by name and phone, filters, and sorting — for example, you can show those with the largest debt first.

### Actions in the list

The **"Create debtor"** button adds a new person. Next to each row: **"View"** (open the card), **"Edit"** and **"Delete"**.

## How to add a debtor

Press **"Create debtor"**. The form is very simple — just two fields:

- **"Full name"** `*` — the person's name.
- **"Phone"** `*` — a contact number.

Both fields are required. Press save and the debtor appears in the list.

> [!NOTE]
> You don't enter a debt amount when creating a debtor. The debt appears and grows on its own when you record a credit sale to this person, and shrinks when they pay.

## The debtor card

Open a debtor to see the full picture.

At the top are the name, phone and a large **"Current debt"** line. If the debt is above zero, it is highlighted in a warning color.

Below is a panel of figures the program calculates itself:

| Figure | What it means |
| --- | --- |
| Active debts | How many credit deals are still open |
| Overdue | The amount that should already have been repaid |
| Overdue debts | How many deals are past their due date |
| Total issued | How much credit was given over all time |
| Collected in payments | How much has been received back |
| Repayment ratio | What share of debt is repaid on average |
| Longest overdue | The longest payment delay (in days) |
| Days without payment | Days since the last payment |
| Last payment | The date of the last payment |
| Next due date | The nearest date a payment is expected |

Next to that is a **risk badge**: **High risk**, **Medium risk** or **Low risk**. It is a hint about how carefully you should keep extending this person credit. Below the badge is a **"Why this risk"** block — the program lists the reasons (for example, a large overdue amount or a low repayment ratio).

The card also contains the debtor's deal history. Use it to jump to the deal you need in order to take a payment.

## How to take a payment

This is the most important part. A payment is always recorded **on a transaction**, not directly on the debtor card.

1. Open the debtor card and find the deal in their history (or open the **"Transactions"** section and find it there).
2. Open that credit transaction.
3. Press **"Record payment"**.
4. Enter the amount (the whole balance is filled in by default), add a note if you like, and confirm.

After that the total debt and all the figures on the debtor card recalculate on their own.

> [!IMPORTANT]
> Only the administrator and the owner can record a payment. A seller can see debtors and can create and edit them, but does not process payments.

## Who can do what

| Action | Administrator | Owner | Seller |
| --- | --- | --- | --- |
| View debtors | yes | yes | yes |
| Create and edit | yes | yes | yes |
| Delete a debtor | yes | yes | no |
| Take a payment (on a transaction) | yes | yes | no |
