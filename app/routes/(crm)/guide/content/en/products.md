# Products and categories

The **"Products"** section (`/products`) is your store catalog, holding unit prices, units of measure, live stock counts, and automated stock health insights. The **"Categories"** section (`/categories`) lets you organize products into departments (such as "Beverages", "Groceries", or "Household") for faster browsing and reporting.

> [!NOTE]
> Every role — including **Sellers** — can browse the product catalog and open product detail pages to check prices, photos, and available stock. Creating, restocking, editing, and deleting products, as well as managing categories, are available to **Administrators** and **Owners**.

## Products list and mobile view

On a computer, the table displays these columns by default:

| Column | What it shows |
| --- | --- |
| **Name** | Product photo and title |
| **Price** | Selling price per unit |
| **Quantity** | Current stock on hand (highlighted in red when at or below your low-stock threshold) |
| **Health** | Automated stock health rating (see table below) |
| **Reorder Priority** | Urgency recommendation for restocking |

Use the **"Columns"** button to show optional columns: **"Days of Stock"**, **"Sold"**, **"Revenue"**, **"Category"**, **"Market"**, **"Transactions"**, and **"Created At"**.

### Compact mobile row and swipe actions

On a phone, each product is presented as a clean row showing its photo, name, category, price, stock count, and a **single combined status indicator**:
- **"Out"** (red) — out of stock;
- **"Low · Xd"** (red) — critically low stock, only a few days left;
- **"Soon · Xd"** (amber) — time to plan a reorder;
- **"Returns"** (amber) — high return rate;
- **"Slow"** (gray) — slow-moving item;
- **green dot with days of stock** (or `>1y`) — stock is healthy.

Swipe any product row **to the left** (or long-press for half a second) to reveal quick **"Restock"**, **"Edit"**, **"Archive"** and **"Delete"** buttons (for Administrators and Owners; "Delete" only for products with no sales).

### Filters and the "Analysis Period"

Above the list sit the search box and the **"Filters"** panel (filter by category, market, stock health, reorder priority, and price range).

Pay special attention to the **"Analysis Period"** filter: it sets the time window (for example, 7, 30, or 90 days) over which the system calculates units sold, revenue, and estimated **"Days of Stock"**. It never hides products from your catalog — it only adjusts the sales window used for those metrics.

### Stock health and reorder priority badges

| Health / Priority | What it means |
| --- | --- |
| **Healthy** / **Stock is fine** | Selling steadily with plenty of stock on hand |
| **Low stock** / **Reorder soon** | Stock is approaching your threshold — plan to restock soon |
| **Critically low** / **Reorder now** | Only a few days of supply remain — restock immediately |
| **Out of stock** | Zero units left on hand |
| **High returns** | Customers are returning this item more often than usual |
| **Slow moving** / **No sales** | Selling slowly or had zero sales during the selected period |

## Product detail page and quick "Restock"

Tap any product to open its detail page (`/products/:id`). The header provides three management buttons:

- **"Restock"** — the primary action when a new shipment arrives;
- **"Edit"** — change the product's name, price, cost price, description and photo (stock is not edited here — see below);
- **"Delete"** — remove the product (with confirmation).

### How to restock a product

When new inventory arrives, you don't need to do mental math on the edit screen:

1. Open the product detail page and click **"Restock"**.
2. In the **"Restock: [Product Name]"** modal, enter the incoming quantity in **"How many to add"** or tap one of the quick chips: **`+10`**, **`+50`**, **`+100`**.
3. The preview beneath immediately shows **"In stock now"** → **"Will be"**.
4. Click **"Add"** — the new units are added to your current stock automatically.

> [!TIP]
> **"Restock"** always **adds** to the current stock count. If you did a stocktake and the number is wrong, use **"Recount"** (see below).

## Stock under control: write-off, recount, history

A product's stock changes in only four ways, and each one leaves a line in the **"Stock history"** on the product page (who, when, by how much, and the balance afterwards): **sale/refund**, **"Restock"**, **"Write off"**, **"Recount"**. The edit form can't change stock, so the history always shows where goods went. The **"Stock management"** block and the history are available to Administrators and Owners.

- **"Write off"** — damaged, expired, lost or stolen, own use, other. Enter the quantity and a reason (a note is optional). You can't write off more than is in stock.
- **"Recount"** — you counted the shelf and enter how many are **actually there** (the new total, not an increase). The app shows the difference from the record and logs it in the history. If a sale went through while you were counting, the stock refreshes and you'll be asked to enter the number again.

### Archive instead of delete

A product that has been sold **can't be deleted** — receipts refer to it. Tap **"Archive"** instead (on the product page or by swiping the row). An archived product disappears from the list and from sales and is left out of the stock summary, but its history and old receipts stay. To see the archive pick **"Show → Archive"** above the list; bring a product back with **"Restore from archive"**. A product that was never sold can still be deleted.

### Stock summary and bulk price change

Above the list (Administrators and Owners) you'll see three numbers for all active products: **"Products"**, **"Stock"** (value of the stock at retail prices) and **"Profit"** (what you can earn on the stock). Profit counts only products that have a cost price, so the count of those without one is shown next to it. Tap **"Out: N"** or **"Low: N"** to open that list.

The **"Prices"** button changes prices of many products at once: enter a percentage (e.g. `+5` or `−10`), optionally pick a category and a rounding step, tap **"Check"** to preview what will change, then **"Apply"**. Cost prices and past receipts are untouched; archived products are skipped.

## How to create a product

Click **"Create product"** (`/products/create`) and fill in the form:

- **"Image"** — upload a product photo from your phone or computer.
- **"Name"** `*` — product title.
- **"Category"** — pick a category from the selection sheet (optional).
- **"Price"** `*` — selling price per unit.
- **"Cost price"** — what you pay for the product; used to calculate profit and visible only to Administrators and Owners.
- **"Opening stock"** `*` — how many are on hand now (0 or more); afterwards stock changes through "Restock", "Write off" and "Recount".
- **"Unit"** — **pcs** (pieces), **kg** (kilograms), **l** (liters), **m** (meters), or **box** (boxes).
- **"Low Stock Threshold"** — minimum stock level at which the quantity turns red and triggers a low-stock alert.
- **"Description"** — short description of the product (optional).

## Product categories

The **"Categories"** section (`/categories`) manages all product groups:

- Clicking **"Create category"** opens `/categories/create` with fields for **"Image"**, **"Name"** `*`, and **"Description"**.
- Tapping any category opens its detail page (`/categories/:id`) listing all products in that category along with **"Edit"** and **"Delete"** buttons (also available via left swipe on mobile).

## Access by role

| Action | Administrator | Owner | Seller |
| --- | --- | --- | --- |
| View product catalog and detail pages (`/products`) | Yes | Yes | Yes |
| Pick products when recording a transaction | Yes | Yes | Yes |
| Quick stock addition ("Restock") | Yes | Yes | No |
| Write-off, recount, stock history, stock summary, bulk price change | Yes | Yes | No |
| Archive and restore from archive | Yes | Yes | No |
| Create, edit, and delete products | Yes | Yes | No |
| View and manage "Categories" | Yes | Yes | No |
