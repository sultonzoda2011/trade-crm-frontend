# Sellers and users

These are two views of the accounts of the people who work in the system.

- **"Sellers"** — the staff of a market who record sales. They are managed by the administrator and the owner.
- **"Users"** — all accounts with roles. This section is available only to the administrator.

Underneath they are the same accounts, just shown from different angles.

## Sellers

The seller list shows these columns:

| Column | What it shows |
| --- | --- |
| Name | The seller's name, avatar and email |
| Email | The address they sign in with |
| Market | Which market they work at |

Next to each row are the actions: open the card, edit, delete.

### How to add a seller

Press **"Create seller"** and fill in:

- **"Image"** — a photo of the staff member.
- **"Full name"** `*` — the seller's name.
- **"Email"** `*` — the address they will sign in with.
- **"Password"** `*` — the first sign-in password.

When editing a seller the password field is **optional**: leave it empty to keep the password, or enter a new one to reset it.

### A seller's markups

Open a seller's card — besides the basic details there is a **"Markup balance"** block. A markup is the amount a seller adds to the price on a sale (the "Markup" field in a deal). It accumulates as their earnings.

| Figure | What it means |
| --- | --- |
| Accrued | How much markup has been earned in total |
| Reduced by refunds | How much was written off due to refunds |
| Already paid out | How much has already been paid to the seller |
| To pay out | How much is left to pay right now |

### How to pay out a markup

When there is something to pay (**"To pay out"** is above zero), a **"Pay out"** button appears on the card. It opens the **"Pay out a markup"** window:

- **"Payment amount"** `*` — how much you are paying (no more than the amount to pay out).
- **"Note"** — an optional remark.

After the payout the balance drops by the amount paid.

## Users

The **"Users"** section is available only to the administrator. Here you can see all accounts and their roles.

| Column | What it shows |
| --- | --- |
| Name | The name and avatar |
| Email | The address they sign in with |
| Role | A colored role badge (see below) |

The **"Market"** column is hidden (turn it on with the "Columns" button). The lists can be filtered by role, market and owner.

The role badges are colored differently so they're easy to tell apart:

| Role | Color | What they can do |
| --- | --- | --- |
| Administrator | Violet | Full access to everything |
| Owner | Amber | Manages their own market |
| Seller | Sky blue | Records sales at their market |

### How to add a user

Press **"Create user"** and fill in:

- **"Image"** — a photo.
- **"Role"** `*` — Administrator, Owner or Seller.
- **"Full name"** `*` — the person's name.
- **"Email"** `*` — the sign-in address.
- **"Password"** `*` — the first password. There is an eye icon next to it — tap it to show or hide the entered password.

When editing a user the password is optional — leave the field empty to keep it unchanged.

## About passwords and access

> [!NOTE]
> There is no separate "reset password" button and no "block/unblock" feature in the program. The password is set by the administrator (or by the owner, for a seller) at creation, and it can be changed by editing the account and entering a new password.

## Who can do what

| Action | Administrator | Owner | Seller |
| --- | --- | --- | --- |
| View sellers | yes | yes | no |
| Create and edit sellers | yes | yes | no |
| Delete a seller | yes | yes | no |
| Pay out a markup | yes | yes | no |
| Work with the "Users" section | yes | no | no |
