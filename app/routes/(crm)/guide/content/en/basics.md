# Getting started

Welcome to **Trade CRM** — a system for managing markets, sellers, products, debtors, and sales. This guide explains every screen and every interface detail in plain language. If you're not sure where to begin, you've come to the right place.

> [!TIP]
> There is a search bar at the top of the guide. Start typing any word (for example, "refund", "debtor", "queue", "inventory") — the guide will automatically find matching sections, show the match count, and highlight the words in the text.

## How to use this guide

On a computer, the table of contents sits on the left. Click any section to open it. On a phone, the section list is tucked behind the **"Contents"** button — tap it, choose a section, and it opens right away.

Each section is broken into clear subheadings. Scroll through the page or use the search box at the top to jump straight to the answer you need.

## Signing in

To start working, sign in with your account:

1. Open the app — you will see the sign-in screen.
2. Enter the **email** and **password** provided by your administrator or market owner.
3. Press **"Sign in"**.

If your email or password is incorrect, an error message will appear — check your keyboard layout and letter case, then try again.

> [!NOTE]
> Accounts are created by the administrator (or by the market owner for their sellers). You cannot reset a forgotten password on your own — contact your manager.

After signing in, the app remembers your session so you don't need to enter your credentials every time. To sign out, tap your avatar in the top-right corner and select **"Sign out"**.

## Interface overview

The layout adapts automatically to your screen size — desktop, tablet, or phone.

### Desktop and mobile navigation

- **On a computer or tablet**, the **side menu** on the left groups sections logically ("Main", "Trade", "Catalog", "Team", "Administration"). You can collapse it into a narrow icon strip using the toggle button next to the logo to give tables more room.
- **On a phone**, the side menu is replaced by a floating **bottom navigation bar**:
  - The left and right slots hold the most frequently used sections for your role (such as **"Home"**, **"Transactions"**, **"Debtors"**).
  - The raised **"+"** button in the center opens the new sale screen (`/transactions/create`) from anywhere in one tap.
  - The **"More"** button on the far right opens a bottom sheet with all remaining sections.
  - Whenever the on-screen keyboard opens or you enter a create/edit form, the bottom bar hides itself automatically so it never blocks your input.

### App header

The top bar contains:

- **Sync button** (circular refresh icon) and **connection / queue badge** — lets you refresh data in one click or open the **"Sync"** screen. When you are online and the send queue is empty, extra status badges stay hidden to keep the header clean.
- **Quick search** (on desktop).
- **Theme and language toggles** (shown directly in the header on wide screens, and inside the user menu on phones and tablets).
- **Profile avatar** — opens the user menu (**"Profile"**, **"Sync"**, **"Theme"**, **"Language"**, **"Sign out"**).

### System-wide quick search (`Ctrl + K`)

On a computer, click the **"Search"** button in the header or press **Ctrl + K** (**Cmd + K** on Mac).

From the command palette you can:
- jump straight to any section available to your role;
- trigger a quick action — **"Create product"** or **"Create transaction"**;
- type 2 or more characters to find a specific **product** (with photo and price), **market** (with address), or **user** and open its page immediately.

### Theme and language

- **Theme:** both **light** and **dark** themes are supported. Switch anytime using the sun/moon icon in the header or the **"Theme"** item in the user menu.
- **Language:** the entire interface and this guide are available in **Russian (РУ)**, **English (EN)**, and **Tajik (ТҶ)**. Your choice is saved automatically.

## Required fields and the asterisk "*"

On every create or edit form, some field labels have a red asterisk **`*`** next to them.

> [!IMPORTANT]
> An asterisk `*` marks a **required field** (for example, "Name *"). The form cannot be saved without it. Fields without an asterisk are optional and can be left blank.

If you try to save a form with a missing or invalid required field, a **red hint** appears directly underneath explaining what needs to be fixed. As soon as you correct the field, the error clears.

## Common interface elements and gestures

These patterns work the same way across every section of Trade CRM:

- **Tables and lists.** Tapping or clicking any row opens the detail page for that record. On a computer, numeric and date columns can be sorted by clicking their header, and the column toggle button lets you hide columns you don't need.
- **Swipe left on mobile lists (quick actions).** On a phone, **swipe any row to the left** (or **long-press the row for half a second**) to reveal colored action buttons on the right — such as **"Pay"**, **"Restock"**, **"Edit"**, or **"Delete"**. You can perform everyday actions right from the list without opening the detail page. Tapping an open row closes the action buttons.
- **Selection sheets (pickers).** Choosing a product, debtor, seller, category, or market opens a tall, finger-friendly bottom sheet with built-in search. When offline, the sheet automatically uses data saved on your device and shows a note reminding you that the list is running from local storage.
- **Filters and active filter pills.** The **"Filters"** button opens a side panel to filter by date range, amount, status, or market. Active filters appear above the list as compact "pills" — date or number ranges are combined into a single readable pill that you can clear with one tap, or you can clear everything with **"Reset"**.
- **Detail page header.** Every detail page (product, transaction, debtor, seller, market) starts with a unified header showing the photo or avatar, status badges, and action buttons (**"Edit"**, **"Delete"**, plus section-specific buttons like **"Restock"** on a product or **"Pay"** and **"Refund"** on a transaction).
- **Delete confirmation.** Deleting any record always asks for confirmation in a modal dialog so nothing is ever removed by accident.

## Roles and permissions

What you see in the navigation and which buttons are active depend on your **role**. Features outside your permissions are hidden automatically.

| Role | What they can do |
| --- | --- |
| **Administrator** | Full access across the entire system: Dashboard and analytics, all markets, users, sellers, products, categories, debtors, sales, and refunds |
| **Owner** | Full management of their own market: Dashboard and reports, sellers and commission payouts, products, categories, debtors, sales, payments, and refunds |
| **Seller** | Working in their market: recording credit sales, viewing transactions, adding and editing debtors, browsing the product catalog, and viewing "My market" |

> [!NOTE]
> Sellers do not have access to the **"Dashboard"**, recording debt payments or refunds, deleting debtors, or modifying the product catalog — after signing in, they go straight to **"Transactions"**.

## Working offline

Trade CRM is built for unreliable connections and works smoothly as an Android app. Lists and cards are cached on your device, and new sales, debtors, payments, and refunds created offline are placed in the send queue, appear immediately in lists with a **"Queued"** badge, and sync to the server automatically once your connection returns. See **"Offline mode and syncing"** for full details.
