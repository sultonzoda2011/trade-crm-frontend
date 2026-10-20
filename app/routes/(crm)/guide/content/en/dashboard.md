# Dashboard and reports

The dashboard is the home screen for the administrator and the owner. It opens right after you sign in and shows how business is going: what was sold, how much money came in, who owes you, what is running low, which products sell best, and how the sellers are doing. All the numbers are on one screen, split across tabs.

> [!NOTE]
> The dashboard is seen by the administrator and the owner. A seller does not have this screen — after signing in they go straight to the **"Transactions"** section to record sales.

## Filters at the top

Above the tabs are two filters that apply to every tab at once:

- **"Period"** — the span the numbers are calculated over: **Today**, **Week**, **Month** or **Year**. On "Overview" the default is **Today**, on the other tabs it is **Month**. The week counts from Monday, the month from the 1st, the year from 1 January, always up to today. The exact date range is shown next to it.
- **"Seller"** — you can view the overall numbers (**"All sellers"**) or pick one seller to see only their results.

The filters are kept when you switch tabs, and you can share a link to a specific tab with the filter already applied.

## Dashboard tabs

The dashboard is split into four tabs: **"Overview"**, **"Inventory"**, **"Products"** and **"Sellers"**.

### Overview

The main tab answers the evening question "how did the day go?". It opens with the period set to **"Today"**; the other tabs default to the **month**.

**Sold.** The big card at the top: the value of goods that left the shop in the period — cash, card and credit together, minus returns. Under it are two lines that must not be confused:

| Line | What it means |
| --- | --- |
| Money received | Money that actually came in: cash and card sales plus payments on older debts in this period |
| Given on credit | Goods that left without payment. They become money only when the debt is paid back |

When a single seller is picked, payments on older debts are not added to "Money received": the system counts them for the whole shop, not per seller, and crediting them to one seller would be untrue. In that case the line is called "Received in cash or by card". If there were returns in the period, a note under the card says how much — it is already subtracted from "Sold".

**Needs attention.** A short list of what matters right now: overdue debts, products running out, a sharp rise in returns. Every row is a link that takes you straight to the matter. The first four are shown, the rest behind **"Show all"**. If all is calm it says "Nothing urgent".

**Owed to us.** How much is unpaid **right now** (not "issued in the period") and by how many people. Below it, how much of that is overdue, how much is coming due, and how much is not due yet or has no due date. The rows open the matching debt list, and **"Who to call first"** opens the high-risk debtors.

**Running low.** Products it is time to restock, with an explanation for each: how much is left, how many days it lasts at the current pace, whether the stock is below your minimum, and roughly how much to order. It is calculated **from the last 28 days of sales** and does not change with the period switch — one day of sales is not enough to judge stock. If there were no sales at all in 28 days, "how long it lasts" cannot be calculated, and the card says so. There is no "add to purchase" button because the app has no purchase list; the row opens the product.

**Best sellers.** The three products that earned the most in the period (minus returns). **"All products"** leads to the Products tab.

**Selling better or worse.** Categories whose sales changed noticeably (by 15% or more) compared with the previous period, with "was → now" amounts. Individual products are not compared: the server gives no previous-period figures per product, and we won't make them up. This card is hidden for short periods (see below).

**Sales by day** is a chart. **How customers paid** shows cash, card and credit in one bar, with amount and share. **Details** has the number of operations, the average sale, discounts and returns. **Latest operations** lists the five most recent transactions.

With no internet the saved data is shown, with a line saying what time it is from. If nothing has been saved for a tab yet, it says so plainly with a link to sync.

### Inventory

Everything about stock and returns:

- **"What to order"** — a list of products it's time to restock.
- **"Stock health"** — how many products there are in total, how many to order, how many are healthy, the value of the stock, and how much money is "frozen" in slow-moving goods.
- **"Returns"** — the amount and share of returns, how many units were returned, and which products are returned most often.

### Products

Product rankings for the period:

- **"Top by revenue"** — which products brought in the most money.
- **"Top by units"** — which sell in the largest quantities.
- **"Categories"** — how groups of products sell.

### Sellers

A report on the sellers' work. At the top are four figures: the number of sellers, **"Sales amount"**, **"Refunds amount"** and **"Issued on credit"**. Below is a table showing, per seller: how many sales and for what amount, how many refunds and for what amount, and how much credit was issued.

## How to read the comparison

A rise or fall is shown **vs the same days last week**, **vs the same point last month or year**: the previous period is taken at the same length. So an unfinished month is compared with the same stretch of last month, not with the whole of last month.

For short stretches — **"Today"**, the first two days of a week or month — no percentage is shown; instead it says what the figure was before. The reason is simple: in the morning any day looks like a "collapse" next to a whole yesterday, and that alarm should not be raised. For the same reason the chart and the "Selling better or worse" card are hidden for short periods, and the "sales are down" alert does not fire.

For sales and the average sale a rise is good. For returns and debts it's the opposite: less is better, so a rise there is highlighted as a warning.

## Who sees the dashboard

| | Administrator | Owner | Seller |
| --- | --- | --- | --- |
| Dashboard and all tabs | yes | yes | no |

The owner sees the figures for their own market. The administrator sees the data overall; if they have no market of their own, a link **"All markets"** appears at the bottom of the Overview.
