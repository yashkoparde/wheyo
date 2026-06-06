# WHEYO: PRECISION MACRO-ENGINEERING
## Technical Documentation & Development Report

> **Project:** WHEYO - Precision Fuel Extraction System
> **Lead Architect:** [Your Name/Team]
> **Status:** Operational
> **Date:** May 17, 2026

---

# Chapter 1: Introduction

### 1.1 Project Overview
WHEYO is a high-performance digital ecosystem designed to bridge the structural gap between standard campus nutritional offerings and the rigorous requirements of student-athletes. In an era where "Cafeteria Food" often fails to meet specific macronutrient targets, WHEYO serves as a tactical interface for precision fuel procurement.

### 1.2 Problem Statement
Athletes on campus face three primary obstacles:
1. **Macro-Opacity**: Standard food services provide calories without detailed protein/carb/fat breakdowns.
2. **Logistical Friction**: Traditional ordering systems are slow and lack dynamic "extraction points" (campus hotspots).
3. **Tracking Disconnect**: No unified platform exists to synchronize consumption records with goal-oriented tracking.

### 1.3 Objectives
- **Liquidate Nutritional Ambiguity**: Provide exact protein (PRO) and calorie (KCAL) data for every meal.
- **Logistical Optimization**: Utilize WhatsApp as a direct synaptic link for rapid order serialization.
- **Biometric Feedback**: Implement a "Protein Overdrive" dashboard to visualize gain-streaks and daily targets.
- **Brutalist UX**: Deliver a high-contrast, motion-heavy interface that mirrors the intensity of athletic training.

---

# Chapter 2: Literature Survey

### 2.1 Modern Web Architectures (React 19 & Vite)
Modern frontend development requires highly responsive, state-driven interfaces. The transition to **React 19** allows for improved hook performance and streamlined rendering pipelines. **Vite** serves as the rapid-build engine, providing near-instantaneous hot-module replacement (HMR), critical for iterative UI polishing.

### 2.2 Synaptic Data Management (Supabase & RLS)
Traditional SQL management often introduces significant latency. **Supabase**, built on PostgreSQL, provides a "Real-time Neural Storage" layer. The implementation of **Row Level Security (RLS)** is paramount, ensuring that biometric and order data remain isolated to the specific user ID, preventing cross-tenant data leaks.

### 2.3 Visual Psychology of Brutalist Design
Research into performance-oriented UIs (such as those used in digital cockpits and high-end fitness equipment) suggests that **High-Contrast (Dark Mode)** and **Monospaced Typography** reduce cognitive load during high-focus activities. The use of `#D4FF00` (Electric Lime) provides maximum visual saliency against a `#050505` foundation.

### 2.4 Kinetic Feedback Systems (Motion.dev)
Studies in UX interactivity indicate that "Kinetic Experience" — fluid state transitions and layout animations — increases user retention. Utilizing **Motion.dev (Framer Motion)** allows for non-blocking UI changes that feel physical and responsive.

---

# Chapter 3: Methodology

### 3.1 The Tech Arsenal (Stack)
| Module | Technology | Designation |
| :--- | :--- | :--- |
| **System Core** | React 19 | Primary Processing Unit |
| **Data Link** | Supabase | Synaptic Neural Cloud |
| **Visual Layer** | Tailwind CSS 4.0 | Tactical Asset Rendering |
| **Animation Engine**| Motion.dev | Kinetic State Management |
| **Analytics** | Recharts | Macro-Visual Interpretation |

### 3.2 System Architecture
1. **The Order Pipeline**:
   - Items are selected via a **Menu Controller**.
   - Macros are calculated in real-time within the **Cart Context**.
   - Orders are serialized into JSON and beamed via **WhatsApp API**.
2. **The Tracking Engine**:
   - Order completion triggers an atomic update to the `daily_macros` table.
   - **Protein Overdrive Dashboard** fetches a 7-day trailing window of consumption.
   - **TDEE/BMR Tactical Computer** calculates maintenance zones based on user metrics (Height, Weight, Activity).

### 3.3 Security & RLS Protocol
The system enforces a **Zero-Trust** policy at the database level:
- **Private Data Isolation**: Only the authenticated owner can `SELECT` or `UPDATE` their `daily_macros` entry.
- **Identity Integrity**: `auth.uid()` checks are hardcoded into every Supabase policy to prevent "Identity Spoofing."
- **Immutable Historical Logs**: Order records are secured via `SET NULL` on delete, preserving audit trails for system integrity.

### 3.4 Implementation Strategy
- **Sprint 1**: Core Neural Link (Supabase setup & Auth).
- **Sprint 2**: The Menu Interface (Brutalist rendering & Cart logic).
- **Sprint 3**: Protein Overdrive (Analytics & Tracker synchronization).
- **Sprint 4**: Extraction Logistics (WhatsApp integration & Pickup point selection).

---

<div align="center">
  <b>DOCUMENT END // FOR THE GRIND. BY THE GRIND.</b>
</div>
