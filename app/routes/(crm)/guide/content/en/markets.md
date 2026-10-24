# Markets

In Trade CRM, a market represents an individual store or trading location. Each market has its own owner, team of sellers, product catalog, debtor list, and transaction history, keeping the records of different locations cleanly separated.

## Two entry points: "Markets" and "My market"

Depending on your role, the navigation menu shows one of two items:

- **"Markets"** (`/markets`) — visible to **Administrators**. Opens the master list of all markets in the system with search and filters.
- **"My market"** (`/markets/:id`) — visible to **Owners** and **Sellers**. Opens the detail page of their assigned market directly.

## Markets list (for administrators)

The **"Markets"** table shows:

| Column | What it shows |
| --- | --- |
| **Name** | Market photo/logo, name, and street address |
| **Products** | Number of products in this market |
| **Debtors** | Number of debtors in this market |
| **Owner** | The user who owns and manages this location |

Use **"Columns"** to reveal **"Transactions"** and **"Created at"**, or open **"Filters"** to filter by owner, creation date, **"Has users"**, or **"Has products"**.

On a phone, swiping a market row **to the left** reveals quick **"Edit"** and **"Delete"** buttons.

## How to create or edit a market

Only an **Administrator** can create a new market via **"Create market"** (`/markets/create`):

- **"Image"** — photo or logo of the location;
- **"Name"** `*` — market or store name;
- **"Address"** `*` — physical address;
- **"Owner"** `*` — pick the market owner from the searchable selection sheet.

When editing a market (`/markets/:id/edit`):
- **Administrators** can update any field — including reassigning the **"Owner"** — or delete the market.
- **Owners** can update their own market's photo, name, and address (changing the owner and deleting the market are restricted to administrators).

## Market detail page and tabs

At the top of the market page sit the market photo, name, address, owner badge, and three **clickable counters** — **"Products"**, **"Debtors"**, and **"Transactions"**. Clicking any of these counters takes you straight to that section pre-filtered to this market.

Below the header are the market's tabs:

1. **"Employees"** — the owner and sellers assigned to this location.
2. **"Products"** — the market's product catalog, showing prices, **"Sold X"** counts, and mini-avatars of the sellers who sold each item.
3. **"Debtors"** — the market's debtors.
4. **"Transactions"** — the market's transaction history.

> [!NOTE]
> When an **Owner** or **Seller** opens **"My market"**, **all four tabs** are available. When an **Administrator** opens another market from the `/markets` list, only the **"Employees"** tab is displayed.

## Access by role

| Action | Administrator | Owner | Seller |
| --- | --- | --- | --- |
| Master "Markets" list (`/markets`) | Yes | No | No |
| "My market" menu item (`/markets/:id`) | No (uses "Markets") | Yes (all 4 tabs) | Yes (all 4 tabs) |
| Create and delete markets | Yes | No | No |
| Edit market name, address, and image | Yes (any market) | Yes (own market) | No |
| Assign or change the market owner | Yes | No | No |
