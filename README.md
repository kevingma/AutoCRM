
# AutoCRM

AutoCRM is an AI-powered CRM platform built with **SvelteKit** and **Supabase**, integrating generative AI to streamline ticketing, live chat, and more. It supports role-based user management (customer, employee, admin), multi-step approvals, and flexible integrations (Stripe billing, email automation with Resend, etc.).

This README covers local development, environment variables, feature highlights, and deployment basics.

---

## Table of Contents

1. [Features Overview](#features-overview)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Project Setup](#project-setup)
5. [Supabase Setup & Database](#supabase-setup--database)
6. [Environment Variables](#environment-variables)
7. [Running Locally](#running-locally)
8. [Testing and Linting](#testing-and-linting)
9. [Deployment](#deployment)
10. [Email Setup](#email-setup)
11. [Stripe Billing Setup](#stripe-billing-setup)
12. [Live Chat & AI Integration](#live-chat--ai-integration)
13. [Directory Structure](#directory-structure)
14. [License](#license)

---

## Features Overview

- **User Authentication & Profiles:** Built on Supabase Auth. Users can sign up with email/password or OAuth (GitHub, etc.).
- **Role-Based Access:**
  - **Customers** open tickets, interact with AI-driven live chat, and see their own data.
  - **Employees** handle tickets, chat with customers, manage knowledge base, etc.
  - **Administrators** manage all data, approve employees/customers, create teams, define coverage hours, etc.
- **Ticketing System:** 
  - Priority (high, medium, low), status (open, in_progress, closed), and tags (array).
  - Employee assignment, auto-assign logic, and discussion with replies (internal vs. public).
- **Generative AI for Tickets & Chat:**
  - Automatic "assistant" replies in the live chat unless a human agent is connected.
  - Admin or employees can define AI responses for repetitive tasks.
- **Teams & Skills:** 
  - Agents can be grouped into teams (coverage areas). 
  - Agents can have associated skills for specialized ticket routing.
- **Stripe Billing Integration:** 
  - Basic subscription flow with test plan(s).
  - Billing portal accessible via the admin dashboard.
- **Email Notifications (via Resend):** 
  - Optional welcome and admin emails. 
  - Unsubscribe logic stored in the `profiles` table.
- **Live Chat:** 
  - Customer chat with auto AI responses, or request an agent. 
  - Agents see "live chats" assigned or open, can join & close them.
- **Analytics & Admin Tools:** 
  - Optional metrics for agent performance.
  - Pre-built placeholders for integration with email, marketing pages, etc.

---

## Tech Stack

- [SvelteKit](https://kit.svelte.dev/)
- [Supabase](https://supabase.com/) (Auth, Database, Storage)
- [Stripe](https://stripe.com/) (Optional, for subscription payments)
- [Resend](https://resend.com/) (Optional, for email)
- Generative AI: [OpenAI GPT-4 or GPT-3.5](https://openai.com/) integration
- CSS: [Tailwind CSS](https://tailwindcss.com/) + [DaisyUI](https://daisyui.com/)
- Testing: [Vitest](https://vitest.dev/)
- Linting: [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/)

---

## Prerequisites

1. **Node.js** (v16+ recommended)
2. **npm** (v8+ recommended) or **pnpm**
3. **Supabase Account** (if you intend to use the database & auth).
4. **Stripe Account** (if you plan on enabling subscription billing).
5. **Resend Account** (if you plan on sending emails).

---

## Project Setup

1. **Clone the Repository**  
   ```bash
   git clone https://github.com/YourOrg/AutoCRM.git
   cd AutoCRM
   ```

2. **Install Dependencies**  
   ```bash
   npm install
   ```
   *Note:* This will install all devDependencies and handle SvelteKit, Tailwind, ESLint, etc.

3. **Set Up Environment Variables**  
   Copy the example file:
   ```bash
   cp .env.example .env
   ```
   Then fill in your Supabase, Stripe, and email keys. [See environment details](#environment-variables).

4. **Configure Supabase**  
   - Create a Supabase project
   - Grab your `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` from the Supabase dashboard
   - Get your `PRIVATE_SUPABASE_SERVICE_ROLE` from the project settings
   - Run migrations (see next section)

---

## Supabase Setup & Database

1. **Create a Supabase Project** if you haven’t already.
2. **Apply Database Migrations**  
   - The root migrations are stored in `supabase/migrations/`.
   - If you have the [Supabase CLI](https://supabase.com/docs/guides/cli), you can run:
     ```bash
     supabase migration apply
     ```
     Or manually run the `.sql` files in your Supabase project if you prefer.
   - The project also includes an older `database_migration.sql` as a reference. Typically, rely on `supabase/migrations/` for versioned migrations.

3. **Check RLS & Policies**  
   - The default row-level security policies allow users to only read/update their own data. 
   - Adjust as needed in the Supabase dashboard or using the `.sql` policy definitions.

---

## Environment Variables

All environment variables are loaded from `.env` or your hosting provider’s environment settings. Key variables include:

- **PUBLIC_SUPABASE_URL**: The Supabase project URL. 
- **PUBLIC_SUPABASE_ANON_KEY**: The Supabase anon/public API key. 
- **PRIVATE_SUPABASE_SERVICE_ROLE**: A service role key used to handle secure server-side logic.
- **PRIVATE_STRIPE_API_KEY**: Your secret Stripe key, if using Stripe subscriptions.
- **PRIVATE_RESEND_API_KEY**: Your Resend key, if sending emails.
- **OPENAI_API_KEY**: If using OpenAI for generative AI (chat with GPT-4).

See `.env.example` for more details.

---

## Running Locally

1. **Start Development Server**  
   ```bash
   npm run dev
   ```
   This spins up SvelteKit at [http://localhost:5173/](http://localhost:5173/) (or a similar port).

2. **Visit** [http://localhost:5173/](http://localhost:5173/). 
   - The marketing pages (home, blog, pricing) are pre-rendered.
   - The account pages require logging in via Supabase Auth.

3. **Live Reload**  
   - Editing Svelte files or TypeScript triggers hot reload.

---

## Testing and Linting

- **Run tests**  
  ```bash
  npm run test
  ```
  or
  ```bash
  npm run test_run
  ```
  for a single pass.

- **Lint**  
  ```bash
  npm run lint
  ```
  to run ESLint checks.

- **Format Check**  
  ```bash
  npm run format_check
  ```
  ensures code follows Prettier rules.

- **Spell Check** (requires misspell)  
  ```bash
  npm run checks
  ```
  runs multiple checks, including spell-check, formatting, lint, type-check, and tests.

---

## Deployment

By default, the project uses SvelteKit’s `adapter-auto`. For production, you can:

- Switch to your chosen adapter: Netlify, Vercel, Cloudflare, etc. See [SvelteKit Adapters](https://kit.svelte.dev/docs/adapters).
- Set environment variables in your hosting environment or use `.env` with secrets set accordingly.

**Example** (Vercel):
- Install `@sveltejs/adapter-vercel`
- Update `svelte.config.js` to use `adapter-vercel`
- Deploy your repo to Vercel. Make sure the `PUBLIC_SUPABASE_URL`, etc., are set in Vercel’s dashboard.

---

## Email Setup

The project uses [Resend](https://resend.com/) by default:
- **Set** `PRIVATE_RESEND_API_KEY` in your `.env`.
- If you want a different provider, adapt `src/lib/mailer.ts` accordingly.
- See [email_docs.md](./email_docs.md) for more detailed info on customizing and adding new email templates.

---

## Stripe Billing Setup

1. Create a [Stripe account](https://stripe.com/).
2. Put your secret key in `.env` as `PRIVATE_STRIPE_API_KEY`.
3. In `pricing_plans.ts`, define your subscription tiers.
4. Adjust webhooks or consider [Stripe Checkout URL generation](https://stripe.com/docs/payments/checkout) if you want more advanced flows.

When you pick a plan in the UI, the code initiates a Stripe Checkout session, then returns to `/account`. The included code also handles a Stripe billing portal link for upgrading, downgrading, or canceling.

---

## Live Chat & AI Integration

- **Customer** sees a `/account/live_chat` page:
  - If no agent is connected, the AI (OpenAI GPT-4) responds automatically.
  - They can click “Need Human” to request a real agent.
- **Agents/Employees** see `/account/live_chat_agent`:
  - Lists active chats. They can “join” or close them.
  - Messages are stored in the `live_chat_messages` table.

The AI logic is in `src/lib/openai.ts`, using an environment key `OPENAI_API_KEY`. You can easily swap out the provider or model.

---

## Directory Structure

```bash
AutoCRM/
  ├─ src/
  │   ├─ lib/          # Reusable libraries (mail, AI, routing, etc.)
  │   ├─ routes/       # SvelteKit routes
  │   │   ├─ (marketing)/...
  │   │   └─ (admin)/account/...
  │   └─ app.css       # Tailwind entry
  ├─ supabase/
  │   └─ migrations/   # Database migrations
  ├─ static/           # Static assets
  ├─ tests/            # If needed
  ├─ package.json
  ├─ tailwind.config.js
  ├─ svelte.config.js
  ├─ postcss.config.js
  ├─ .eslintrc.cjs
  ├─ .prettierrc
  └─ README.md
```

- **(marketing)**: Public-facing marketing routes (Home, Blog, Pricing, etc.).
- **(admin)/account**: Auth-required routes for user dashboards, tickets, chat, etc.
- **lib**: Contains mailer logic (`mailer.ts`), AI logic, utility code, and server-side helpers.

---

## License

This project is provided under the [MIT License](./LICENSE). You can use and modify it for commercial or personal projects freely.

---

**Enjoy building with AutoCRM!** If you have questions or want to suggest improvements, feel free to open an issue or submit a PR. Contributions are welcome.