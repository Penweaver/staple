# STAPLE LIMITED — Phase 8: Communications & Community Walkthrough

**Consumer Brand:** staple  
**Product Focus:** Location-aware collective purchasing (Food & everyday essentials)  
**Status:** Phase 8 (Communications & Community) Completed & Verified  
**Specification Reference:** MVP Product Definition v1.1 + Founder Addendum v1 (Sections §41, §42, Communications & Notifications)  
**Target Market:** Nigeria (Lagos, FCT Abuja, Rivers, Ogun, Oyo)  
**Currency:** Nigerian Naira (NGN / ₦)

---

## 1. Executive Summary

Phase 8 implements the communications, community live chat, notifications pipeline, and support ticketing infrastructure for **staple**:
1. **Participation-Gated Live Community Chat (Spec §41 & §42):**
   - Live chat rooms are linked to active Group Buys.
   - Access is strictly gated: only users who have participated in at least one Group Buy (`has_participated_in_group_buy = true`), active buyers in that specific room, or Champions/Admins can enter and post.
   - Non-eligible users see a locked state inviting them to make their first purchase to unlock neighborhood discussion.
   - Messages highlight Champion senders with ⭐ badges.
2. **Multi-Channel Notification Pipeline & Termii SMS:**
   - Unified notification dispatcher routing across **in-app inbox**, **Termii SMS** for Nigerian phone numbers (`234XXXXXXXXXX`), Resend transactional emails, and push alerts.
   - Automatic phone normalization handling local 11-digit numbers (`08031234567`) and converting to international DND-compliant format (`2348031234567`).
   - Standard event triggers: price drops (`pricing_tier_reached`), goal reached (`target_reached`), pickup ready (`collection_ready`), festive reminders, and support responses.
3. **Customer Support Ticketing & Dispute Resolution:**
   - Sequential ticket numbering: `STP-TCK-YYYY-XXXX` (e.g. `STP-TCK-2026-0042`).
   - Threaded message history between customer and staple care team.
   - Ticket lifecycle management: `open`, `in_progress`, `resolved`, `closed`.
   - Customer is automatically notified in-app and via SMS when a staff agent replies.
4. **Database Migration (`018_communications.sql`):**
   - Created `ticket_messages` table for threaded conversation logs.
   - Comprehensive RLS policies for `support_tickets`, `ticket_messages`, `notifications`, and `chat_rooms`.
   - Automation triggers: auto-create `chat_room` when a Group Buy becomes `live`, and auto-join participant to `chat_memberships` upon order payment.
5. **Mobile Experience (`@staple/mobile`):**
   - `ChatScreen.tsx`: Participation-gated group buy live discussion room.
   - `NotificationsScreen.tsx`: In-app notification feed with category icons, unread dot indicator, and "Mark all as read" button.
   - `SupportScreen.tsx`: Help center with FAQs, ticket submission modal, and threaded ticket conversation viewer.
   - `HomeScreen.tsx`: Header utility bar with notification bell (unread counter) and help desk button.
6. **Admin Operations Consoles (`@staple/admin`):**
   - `/support`: Customer support desk with ticket queues, status filters, and interactive reply drawer.
   - `/communications`: Broadcast notification composer with cohort selection (All Users, Lekki Hub, Champions, Festive Enrollees), Termii SMS page unit estimator, and cost calculator.
7. **Automated Verification:** 51 automated unit tests passing 100% across the monorepo with 0 TypeScript compilation errors.

---

## 2. Key Deliverables & Architecture

### A. Database Migration (`supabase/migrations/`)

| File | Description |
|------|-------------|
| `018_communications.sql` | `ticket_messages` table for threaded support; comprehensive RLS policies on support, tickets, notifications, and chat; trigger `trg_auto_create_group_buy_chat` to initialize chat rooms on `live` status; trigger `trg_auto_join_group_buy_chat` to enroll buyers into `chat_memberships` and set `has_participated_in_group_buy = true`. |

### B. Backend Edge Functions (`supabase/functions/`)

| Endpoint | Method | Role | Description |
|----------|--------|------|-------------|
| `/communications/chat/rooms/:group_buy_id` | GET | Verified | Gets or initializes chat room and verifies user eligibility (§41). |
| `/communications/chat/rooms/:room_id/messages` | GET | Participant | Returns paginated chat history with sender names and Champion badges. |
| `/communications/chat/rooms/:room_id/messages` | POST | Participant | Validates message length (1–500 chars), sanitizes content, and broadcasts message. |
| `/communications/notifications` | GET | User | Returns user notifications and unread badge count. |
| `/communications/notifications/:id/read` | PATCH | User | Marks single notification as read. |
| `/communications/notifications/read-all` | POST | User | Marks all user notifications as read. |
| `/communications/notifications/dispatch` | POST | Admin | Dispatches notification across in-app, SMS (Termii), and email channels. |
| `/communications/support/tickets` | GET | User/Admin | Lists user tickets (or all tickets with status filters for Admin). |
| `/communications/support/tickets` | POST | User | Opens new ticket and generates `STP-TCK-YYYY-XXXX` sequence. |
| `/communications/support/tickets/:id` | GET | User/Admin | Returns ticket with full message thread. |
| `/communications/support/tickets/:id/messages` | POST | User/Admin | Adds reply message and alerts customer if agent responded. |
| `/communications/support/tickets/:id/status` | PATCH | Admin | Resolves or updates ticket status (`open`, `in_progress`, `resolved`, `closed`). |

### C. Shared Domain Utilities (`@staple/shared`)

- **`validateChatEligibility(profile)`:** Enforces Spec §41 rule: user must have completed at least one order, or be a Champion or Admin.
- **`formatTicketNumber(sequenceNumber, year)`:** Generates standardized `STP-TCK-2026-XXXX` identifiers.
- **`sanitizeChatMessage(content)`:** Validates non-empty input, trims whitespace, strips control characters, and enforces 500-character ceiling.
- **`normalizeNigerianPhone(phone)`:** Normalizes raw phone numbers (`0803...`, `+234...`) to Termii international DND format (`234803...`).
- **`generateTermiiSmsPayload(to, message)`:** Prepares Termii SMS API payload.
- **`formatNotificationTitle(type)`:** Returns localized Nigerian English titles for notifications.

### D. Mobile Experience (`@staple/mobile`)

- **`ChatScreen.tsx`:** Real-time discussion room with participation gate banner, message bubbles, Champion ⭐ badges, and text input bar.
- **`NotificationsScreen.tsx`:** In-app notification inbox with Unread/All tabs, emoji category icons, and deep-link actions.
- **`SupportScreen.tsx`:** Help topics & FAQs, ticket roster with status pills, "+ New Ticket" modal, and live chat conversation drawer with staple care agents.
- **`HomeScreen.tsx`:** Header utility bar with notification bell (unread counter) and help desk button.

### E. Admin Consoles (`@staple/admin`)

- **`admin/src/app/support/page.tsx`:**
  - Support ticketing desk: KPIs (Open, In Progress, Resolved, Avg Resolution Time).
  - Queue table with status filtering.
  - Interactive Conversation Drawer to read customer messages, post staff replies, and resolve tickets.
- **`admin/src/app/communications/page.tsx`:**
  - Broadcast notification composer: target cohorts (All Users, Hub Cohorts, Champions, Festive Enrollees).
  - Termii SMS page estimator & Naira cost calculator.
  - Dispatched broadcasts history ledger.
- **`admin/src/components/AdminNav.tsx`:**
  - Added navigation links for Support Desk (`/support`) and Broadcast & Comms (`/communications`).

---

## 3. Automated Test Verification

All 51 unit tests passed 100%:

```
> @staple/tests@1.0.0 test
> node --test dist/**/*.test.js

✔ Catalogue — Currency Formatting (NGN / ₦) (88.7ms)
✔ Catalogue — MVFQ Validation (Addendum A1) (3.2ms)
✔ Catalogue — Location Availability Rules (0.8ms)
✔ Champion — Application Input Validation (3.8ms)
✔ Champion — 2-Active Concurrent Group Buy Limit (§8) (0.7ms)
✔ Champion — Milestone Reward Qualification on Target Reached (Addendum A3) (97.0ms)
✔ Champion — Performance Tier Resolution (0.6ms)
✔ Champion — Commercial Non-Manipulation Guard (§9) (3.4ms)
✔ Champion — Localized WhatsApp Broadcast Message Generation (1.4ms)
✔ Communications — Live Chat Participation Eligibility Gating (Spec §41 & §42) (2.5ms)
✔ Communications — Support Ticket Sequential Formatting (0.7ms)
✔ Communications — Chat Message Sanitization & Length Guard (1.0ms)
✔ Communications — Nigerian Phone Normalization for Termii SMS Gateway (0.9ms)
✔ Communications — Termii SMS Payload Generation & Localized Notification Titles (0.8ms)
✔ Festive — Owambe 42–100 Day Delivery Planning Window (Spec §39 & §74) (4.0ms)
✔ Festive — Instalment Schedule Mathematical Integrity (Exact Sum Matching) (1.5ms)
✔ Festive — 7-Day Grace Period & Instalment Default Evaluator (Addendum B5, Spec §35) (0.7ms)
✔ Festive — Plan Progress & Completion Tracking (3.9ms)
✔ Festive — Enrollment Validation & Mandatory No-Refund Acknowledgement (0.9ms)
✔ Fulfilment — 6-Digit Pickup Verification Code Generation & Formatting (§29, §63) (8.6ms)
✔ Fulfilment — Nearest Collection Point Allocation (Founder Addendum B4) (1.1ms)
✔ Fulfilment — Order Collection Lifecycle & Group Buy Auto-Completion (4.3ms)
✔ Fulfilment — Hub Operating Hours Evaluator (Nigerian Business Hours) (1.0ms)
✔ Fulfilment — Hub Staging Load Aggregation (0.8ms)
✔ Group Buy Engine — 10-Unit Cumulative User Ceiling (§74) (3.9ms)
✔ Group Buy Engine — Champion Active Capacity Guard (§8) (0.6ms)
✔ Group Buy Engine — Dynamic Tier Price Resolution & Retroactive Rebate Math (§20, §24) (1.6ms)
✔ Group Buy Engine — Social Sharing & Deep Link Generation (§11) (83.5ms)
✔ Location — Haversine Distance Calculation & Formatting (3.3ms)
✔ Location — Breadcrumbs and Short Labels (0.7ms)
✔ Location — Operating Hours Formatting (1.0ms)
✔ Location — Nigerian Initial Launch Markets (§5.1) (0.7ms)
✔ Payment & Orders — Multi-Funding Split Payment Calculation (§23) (2.8ms)
✔ Payment & Orders — Paystack Kobo Boundary Conversion (NGN / ₦) (0.5ms)
✔ Payment & Orders — Anti-Gaming Payment Fingerprint Collision Engine (Addendum A4) (0.8ms)
✔ Payment & Orders — Double-Entry Ledger Debit Math Integrity (§22) (1.2ms)
✔ Pricing Engine — Calculates dynamic tier discount accurately (§20) (2.8ms)
✔ Anti-Gaming (Addendum A4) — Detects payment fingerprint reuse across profiles (2.5ms)
✔ Refund Policy Matrix (§4.1) — LIVE user cancellation qualifies for full refund (3.2ms)
✔ Refund Policy Matrix (§4.1) — TARGET_REACHED cancellation is rejected (0.9ms)
✔ Refund Policy Matrix (§4.1) — MVFQ not met closure qualifies for automatic refund (0.5ms)
✔ Refund Policy Matrix (§4.1) — Festive Plan user cancellation is rejected (no-refund rule §35) (0.7ms)
✔ Refund Policy Matrix (§4.1) — STAPLE Festive Season cancellation qualifies for full refund (Addendum A2) (0.5ms)
✔ Group Buy State Machine — Admin-created bypasses activation to LIVE (2.5ms)
✔ Group Buy State Machine — Champion-created requires activation payment (0.9ms)
✔ Group Buy State Machine — Target reached transitions to TARGET_REACHED (0.6ms)
✔ Group Buy State Machine (MVFQ Addendum A1) — Expiry with paid_quantity >= MVFQ proceeds to DELIVERY_FULFILMENT (0.6ms)
✔ Group Buy State Machine (MVFQ Addendum A1 & A2) — Expiry with paid_quantity < MVFQ transitions to CLOSED and triggers auto-refund (1.0ms)
✔ Wallet Ledger — Credit transaction updates balance correctly (3.7ms)
✔ Wallet Ledger — Debit transaction prevents negative balance (0.9ms)
✔ Wallet Ledger — Checkout Split applies available wallet first, remainder to gateway (§23) (0.7ms)

Total Tests: 51 passing (100%)
TypeScript Diagnostics: 0 errors across all workspaces
```

---

## 4. Final Phase Ahead

**Phase 9 — Admin, Security & Hardening (Weeks 11–12):**
- Scheduled background cron jobs (daily wallet reconciliation, group buy expiry processing, overdue festive instalment scanner).
- System-wide security hardening & rate limiting.
- End-to-end integration & deployment preparation.
