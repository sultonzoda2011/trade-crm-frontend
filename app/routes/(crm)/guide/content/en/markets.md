# Markets

In Trade CRM, a market represents an individual store or trading location. Each market has its own owner, team of sellers, product catalog, debtor list, and transaction history, keeping the records of different locations cleanly separated.

## Two entry points: "Markets" and "My market"

Depending on your role, the navigation menu shows one of two items:

- **"Markets"** (`/markets`) — visible to **Administrators**. Opens the master list of all markets in the system with search and filters.
- **"My market"** (`/markets/:id`) — visible to **Owners** and **Sellers**. Opens the main screen of their assigned market directly.

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
- **"Phone"** — the market's contact number (optional);
- **"Working hours"** — free text, e.g. "Mon–Sat 8:00–18:00" (optional);
- **"Owner"** `*` — pick the market owner from the searchable selection sheet.

When editing a market (`/markets/:id/edit`):
- **Administrators** can update any field — including reassigning the **"Owner"** — or delete the market.
- **Owners** can update their own market's photo, name, address, phone and working hours (changing the owner and deleting the market are restricted to administrators).
- To remove the phone or working hours, clear the field and save.

## The market main screen

The screen works like iPhone "Settings": the market sits at the top (photo, name, address, **"Call"** and **"Edit"** buttons), followed by grouped rows.

- **"Summary"** — how many products, debtors, sellers and transactions the market has. Tapping a row opens that list already filtered to this market.
- **"Money"** (administrators and owners only) — **total debt** and how much of it is **overdue**, **stock value** at retail price and at cost, and how much stock is **running out**. The numbers match the Debtors and Products sections. If some products have no cost price, a hint under the group says the cost-based value is incomplete.
- **"About"** — phone, working hours, owner and creation date.
- **"Team"** — the owner and sellers with phone numbers. Sellers do not see colleagues' emails.
- **"Settings"** (administrators and owners only) — the **"Sellers can sell"** switch.
- **"Market rules"** (sellers) — the same rule in words, read-only.

## Can sellers make sales?

By default a seller records **debts only** at the market, so stock cannot leave the warehouse with no debt and no trace.

If you trust your sellers, turn on **"Sellers can sell"**. Sellers can then also record regular **cash** and **card** sales. The app asks you to confirm before turning it on.

- The switch applies immediately; nothing needs reloading.
- **Refunds, edits and deletes** stay with the owner and administrator even when sales are allowed.
- If you switch it off while a seller still has an offline sale waiting, that sale is rejected when it syncs. **"Sync"** then shows a clear explanation: record it as a debt instead, or remove it from the queue.
- Each market has its own setting.

## Access by role

| Action | Administrator | Owner | Seller |
| --- | --- | --- | --- |
| Master "Markets" list (`/markets`) | Yes | No | No |
| Market main screen (`/markets/:id`) | Any market | Own | Own, read-only |
| Market money (debt, stock) | Yes | Yes | No |
| Colleagues' emails | Yes | Yes | No |
| Create and delete markets | Yes | No | No |
| Name, address, phone, hours, image | Yes (any market) | Yes (own market) | No |
| "Sellers can sell" switch | Yes | Yes (own market) | No |
| Assign or change the market owner | Yes | No | No |
