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

Swipe any product row **to the left** (or long-press for half a second) to reveal quick **"Edit"** and **"Delete"** buttons (for Administrators and Owners).

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
- **"Edit"** — change the product's name, price, description, photo, or overwrite its stock count;
- **"Delete"** — remove the product (with confirmation).

### How to restock a product

When new inventory arrives, you don't need to do mental math on the edit screen:

1. Open the product detail page and click **"Restock"**.
2. In the **"Restock: [Product Name]"** modal, enter the incoming quantity in **"How many to add"** or tap one of the quick chips: **`+10`**, **`+50`**, **`+100`**.
3. The preview beneath immediately shows **"In stock now"** → **"Will be"**.
4. Click **"Add"** — the new units are added to your current stock automatically.

> [!TIP]
> **"Restock"** always **adds** to the current stock count. If you are doing a stocktake and need to correct an inaccurate number directly, use **"Edit"** instead.

## How to create a product

Click **"Create product"** (`/products/create`) and fill in the form:

- **"Image"** — upload a product photo from your phone or computer.
- **"Name"** `*` — product title.
- **"Category"** — pick a category from the selection sheet (optional).
- **"Price"** `*` — selling price per unit (at least 1).
- **"Quantity"** `*` — starting stock on hand (0 or more).
- **"Unit"** — **pcs** (pieces), **kg** (kilograms), **l** (liters), **m** (meters), or **box** (boxes).
- **"Low Stock Threshold"** — minimum stock level at which the quantity turns red and triggers a low-stock alert.
- **"Description"** `*` — short description of the product.

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
| Create, edit, and delete products | Yes | Yes | No |
| View and manage "Categories" | Yes | Yes | No |
