# Products and categories

Products are everything you sell. The **"Products"** section in the left-hand menu is your catalog: prices, stock levels, and hints about what to restock. Categories help group products together (for example, "Drinks", "Household chemicals").

> [!NOTE]
> Products and categories are managed by the administrator and the owner. A seller picks products when recording a sale but does not edit the catalog itself.

## The product list

By default the list shows these columns:

| Column | What it shows |
| --- | --- |
| Name | The product image and name |
| Price | The price per unit |
| Quantity | How much is in stock (turns red when the balance is at the threshold or below) |
| Health | The product's health: healthy, low, critical, and so on |
| Reorder priority | Whether it needs restocking and how urgently |

More columns can be turned on with the **"Columns"** button: **"Days of stock"**, **"Sold"**, **"Revenue"**, **"Category"**, **"Market"**, **"Transactions"**, **"Created"**.

### Calculation period

Above the list there is a **"Calculation period"** filter. It's important to understand: it sets the **window over which the figures are calculated** — how much was sold, the revenue, how many days the stock will last. It is **not** the date a product was added. For example, choosing "last 30 days" shows sales and revenue for the past month, while all the products still remain in the list.

### Product health

The program rates each product's "health" on its own and shows a colored badge:

| Badge | What it means |
| --- | --- |
| Healthy | All good — the product sells and is in stock |
| Low stock | The balance is nearing the threshold — running out soon |
| Critical stock | Very little left |
| Out of stock | None in stock |
| High returns | The product is returned often — worth looking into |
| Slow moving | Sits in stock, sells slowly |
| No sales | Not a single sale in the chosen period |

### Reorder priority

Alongside, the program hints at what to restock:

| Badge | What it means |
| --- | --- |
| Order urgently | Stock is critical — buy this first |
| Order soon | Running out soon — plan a purchase |
| Out of stock | None left — needs replenishing |
| Enough in stock | No need to restock yet |
| No reorder needed | The product doesn't need replenishing |

## How to add a product

Press **"Create product"** and fill in the form:

- **"Image"** — a photo of the product (uploaded from your device).
- **"Name"** `*` — what the product is called.
- **"Category"** — which group it belongs to (may be left empty).
- **"Price"** `*` — the price per unit, at least 1.
- **"Quantity"** `*` — how much is in stock now, at least 0.
- **"Unit of measure"** — how the product is counted (defaults to "pcs").
- **"Low-stock threshold"** — the quantity at which the product counts as running out.
- **"Description"** `*` — a short description of the product.

> [!IMPORTANT]
> Required fields are marked with an asterisk `*`: name, price, quantity and description. Without them the product cannot be saved.

Units of measure:

| Label | Meaning |
| --- | --- |
| pcs | pieces |
| kg | kilograms |
| L | liters |
| m | meters |
| box | boxes |

> [!TIP]
> The **"Low-stock threshold"** is a handy safeguard against a product running out unexpectedly. As soon as the quantity drops to the threshold or below, the number turns red and the product gets a "Low stock" badge and a reorder hint.

## Product image

The photo is uploaded straight from your phone or computer. It appears in the list and on the product card, and also as a small avatar in the transactions where the product was sold.

## Categories

Categories are groups of products. A category has an **"Image"**, a **"Name"** `*` and a **"Description"**. Categories are created and edited in separate pop-up windows. To put a product in a category, select it in the **"Category"** field when creating or editing the product.

Categories make it faster to find products and to filter lists and reports by group.

## Who can do what

| Action | Administrator | Owner | Seller |
| --- | --- | --- | --- |
| View the product catalog | yes | yes | no |
| Create, edit, delete products | yes | yes | no |
| Manage categories | yes | yes | no |
| Pick a product when selling | yes | yes | yes |

> [!NOTE]
> A seller has no access to the products and categories section as a catalog — trying to open it shows an "Access denied" message. But they can still pick products when recording a credit sale.
