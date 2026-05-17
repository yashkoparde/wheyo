# Wheyo Admin Dashboard System Prompt

Use this prompt in a new project to generate the Admin Dashboard.

---

**Prompt:**

Build a high-performance **Admin Dashboard** for "Wheyo - The Protein Kitchen". 

### 1. Aesthetic & Branding
- **Color Palette:** 
  - Dark Background: `#050505`
  - Accent Green: `#D4FF00` (Neon)
  - Accent Orange: `#FF3E00` (Electric)
  - Secondary Gray: `#141414`
- **Typography:**
  - Headings: "Anton" (all-caps, aggressive tracking)
  - UI/Body: "Inter" or "JetBrains Mono"
- **Style:** Brutalist, minimalist, tech-forward. High contrast, sharp corners (limited rounding, max 12px), glassmorphism borders (`white/10`).

### 2. Core Features (React + Supabase)
- **Live Order Feed:** Real-time list of orders from the `orders` table.
  - Kanban board (Pending, Preparing, Ready, Delivered).
  - One-click status updates.
  - Sound notification for new incoming orders.
- **Product Management (CRUD):** 
  - List view of all products.
  - Form to add/edit products (fields: code, name, price, protein, etc.).
  - Toggle for `is_available`.
- **Analytics Dashboard:**
  - Daily/Weekly revenue charts (using Recharts).
  - User acquisition stats (linked to `profiles` table).
  - Top 5 selling items.
  - Protein units sold vs. User targets gap analysis.

### 3. Technical Requirements
- Use **Vite + React + Tailwind CSS**.
- Use **@supabase/supabase-js** for data.
- Use **Lucide-React** for icons.
- Use **Motion** (framer-motion) for smooth layout transitions and status changes.
- Ensure efficient data fetching with `useEffect` and real-time Supabase subscriptions.

### 4. Layout Identity
- Sidebar navigation with aggressive iconography.
- "War Room" style overview for active orders.
- Data density: Show maximum information with minimum clutter. 

Maintain the "Gym/Performance" vibe—the app should look like a mission control for athletes.
