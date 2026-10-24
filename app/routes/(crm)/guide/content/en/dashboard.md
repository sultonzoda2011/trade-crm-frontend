# Dashboard and reports

The **"Dashboard"** screen (`/dashboard`) is the command center for administrators and market owners. It opens right after you sign in and brings together the full picture of your business on one screen: how much was sold, how much actual cash came in, who owes money, which items need restocking, which products bring in the most revenue, and how each seller is performing.

> [!NOTE]
> The **"Dashboard"** is visible only to **Administrators** and **Owners**. Sellers do not have this screen — after signing in, they go straight to **"Transactions"** to record day-to-day sales.

## Period and seller filters

Above the tabs sit two filters that control **"Overview"**, **"Products"**, and **"Sellers"**:

- **Period (pill buttons):** **"Today"**, **"Week"**, **"Month"**, or **"Year"**. The **"Overview"** tab defaults to **"Today"** (acting as your evening assistant), while **"Products"** and **"Sellers"** default to **"Month"**. The week starts on Monday, the month on the 1st, and the year on January 1st, always running up to today. Next to the buttons, a calendar label displays the exact date range.
- **Seller (picker sheet):** defaults to **"All sellers"**, or you can tap it to search and pick a single seller to inspect only their numbers.

Your filter selection stays in the URL when you switch between tabs (and is restored when you return from "Inventory"), so you can bookmark or share a direct link to any filtered view.

> [!TIP]
> On the **"Inventory"** tab, the period and seller filters are intentionally hidden: stock health and sales velocity are always evaluated across the whole store over the last **28 days** (4 full weeks).

## The four dashboard tabs

The dashboard is organized into four tabs: **"Overview"**, **"Inventory"**, **"Products"**, and **"Sellers"**.

### 1. Overview

The main tab is designed to answer the owner's daily question: *"How did today go, and what needs my attention right now?"*

- **Sold.** The headline card at the top shows net goods sold during the period (cash, card, and credit combined, already net of returns). If any returns occurred during the period, a note beneath the total states the exact amount subtracted. Below the main figure are two lines that should never be confused:

| Line | What it means |
| --- | --- |
| **Money received** | Actual cash and card money that came in during the period: cash/card sales **plus** payments collected on older debts |
| **Given on credit** | Goods handed over without immediate payment. This becomes cash only when the debtor pays it back |

> [!IMPORTANT]
> When you filter by a **single seller**, payments on older debts are excluded from their total (debt repayments are tracked at the store level rather than credited to an individual seller). In that view, the label changes to **"Received in cash or by card"**.

- **Needs attention.** A concise list of urgent signals right now: overdue debts, items critically low on stock, a sharp spike in returns, or a drop in sales. Every row is a direct link to the relevant filtered list. Up to 4 items are shown initially, with the rest behind **"Show all"**. When everything is in order, the card simply says **"Nothing urgent"**.
- **Owed to us.** The total unpaid debt **right now** across all debtors and how many people owe money. Below, the total is broken down into three clickable rows:
  - **"Overdue"** — past the due date;
  - **"Due soon"** — approaching the payment deadline;
  - **"Not due yet, or no due date"** — all remaining active debts.
  At the bottom of the card are two action buttons: **"Who to call first"** (opens high-risk debtors `/debtors?risk=HIGH`) and **"All debtors"** (`/debtors`).
- **Running low.** Items that need restocking based on sales velocity over the **last 28 days**: how much is left, how many days the stock will last at the current pace, whether it has fallen below your minimum threshold, and a suggested order quantity.
- **Best sellers.** The top 3 products by net revenue for the period, with an **"All products"** button that switches to the Products tab.
- **Selling better or worse & Sales by day chart.** For periods of 3 days or longer, you see the daily revenue trend chart and categories whose sales shifted by 15% or more ("was → now"). On short periods (such as **"Today"**), instead of showing an empty single-point chart, the layout automatically swaps in **"How customers paid"** right next to the top sellers.
- **How customers paid.** A single breakdown bar comparing cash, card, and credit with exact amounts and percentage shares.
- **Details.** Operation count, average sale amount, discounts granted, and returns.
- **Latest operations.** The 5 most recent transactions with one-tap navigation to each transaction and a **"View all"** button (preserving any active seller filter).

### 2. Inventory

This tab focuses on stock management and answers three questions: **what to order**, **how healthy the stock is**, and **what customers return**. Everything is calculated store-wide over the **last 28 days**, matching the "Running low" card on "Overview".

- **What to order.** Up to 10 of the most urgent items to restock, ordered by priority. Each row shows current stock, estimated days remaining at the current daily/weekly sales pace, whether stock is below your minimum threshold, suggested order quantity, and how many days the stock will last after restocking. Tapping any row opens the product detail page where you can immediately use **"Restock"**.
- **Stock health.** At the top is the total value of all goods currently in stock **at selling price** (since the app does not track purchase cost, this reflects retail shelf value rather than invested capital). Below are interactive rows for each active health state:
  - out of stock;
  - critically low;
  - below your minimum threshold;
  - high returns;
  - slow-moving (showing the retail value tied up on the shelf);
  - no sales in the last 28 days.
  Each row opens the product catalog pre-filtered to that exact health status. A footer note tells you how many products are in good standing out of the total catalog.
- **What gets returned.** Total value and units returned over the last 28 days, return share of sales, comparison against the prior 28 days, and the products returned most frequently.

> [!NOTE]
> Counters on the "Inventory" tab use a rolling **28-day** window, while the filtered catalog lists (`/products?health=…`) use the current calendar month. Because of this slight window difference, the count on a card and the count in the opened list may occasionally differ by one or two items.

### 3. Products

Answers which products bring in the most money, which sell in the highest volume, and how categories perform (respecting both the period and seller filters):

- **Earned the most money.** Up to 5 top products by net revenue (minus returns), showing units sold, units returned, and share of total store revenue.
- **Bought most often.** Up to 5 top products by net units sold (pieces, kg, liters, boxes, or meters). This ranking is drawn from the 20 highest-revenue products returned by the server, as noted beneath the list.
- **Sales by category.** Revenue and share of total sales per category. The top 5 categories are displayed first, with **"Show all"** revealing the rest, plus a dedicated row for uncategorized items. For periods of 3 days or more, each row also shows the change against the previous period.

### 4. Sellers

Shows who sold how much during the selected period:

- At the top is the total **"Sold"** broken down into **"Cash and card"** and **"On credit"**.
- Below is the **"Who sold how much"** ranking ordered from highest to lowest: net sales, share of store sales, comparison with the previous period, and return amounts. The first 5 sellers are shown, with **"Show all"** expanding the full list.
- Owners and administrators who record sales also appear in the ranking with their role badge, while removed accounts are labeled **"Deleted staff member"**.
- **Smart row links:** tapping a seller opens their seller card (`/sellers/:id`), tapping your own row as an owner opens your **"Profile"** (`/profile`), and tapping an owner/admin as an administrator opens their user card (`/users/:id`).
- Returns are always deducted from the seller who made the original sale.

## Period comparisons and offline mode

- **Fair equal-length comparisons.** Every period is compared against a previous stretch of the **exact same length** (for example, the first 10 days of this month vs. the first 10 days of last month).
- **No false morning alarms.** On short stretches (**"Today"** or the first two days of a week/month), misleading percentage drops are hidden — instead, the card calmly displays the previous period's figure for reference.
- **Offline support.** When there is no internet connection, the dashboard displays the most recently cached data on your device along with a banner at the top: *"Offline. Showing data from {time}"*.

## Access by role

| Feature | Administrator | Owner | Seller |
| --- | --- | --- | --- |
| Dashboard and all 4 tabs | Yes (system-wide) | Yes (own market) | No |
| "All markets →" link at the bottom of Overview | Yes (when not tied to a single market) | No | No |
