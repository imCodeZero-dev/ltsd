![imCodeZero logo][image1]

**UI/UX DESIGN REQUIREMENTS**

Deal Radar — Limited Time Super Deals

Project:

**Amazon Deal Discovery PWA**

Prepared by: imCodeZero  |  Date: March 2026  |  Version: 1.0

*For internal use — Design Team only*

![imCodeZero][image2]

**imCodeZero**  
New: Deal of the day (top 10 deals to be shown to admin, he’ll choose the best deal and that would be shown to the user homepage as recommended deal of the day)

**1\. Project Overview**

Deal Radar is a personalized Amazon deal discovery PWA (Progressive Web App). It monitors Amazon for price drops and limited-time deals, matches them against users' watchlists and preferences, and sends real-time alerts.

This document defines all UI/UX requirements for the Figma design phase. It covers every screen, component, user flow, and visual behavior the design team needs to produce before frontend development begins.

*ℹ  Reference: Client's Replit MVP must be reviewed at kickoff for category list, branding direction, and existing UI patterns to carry forward.*

**2\. Design Principles**

* Mobile-first — all screens designed for mobile first, then scaled up to desktop

* Urgency-aware UI — deals are time-sensitive; the design must communicate countdown, scarcity, and urgency clearly

* Clean and scannable — users browse deals quickly; cards must be digestible at a glance

* Personalized feel — the app should feel like it knows the user, not a generic deal aggregator

* Accessible — sufficient color contrast, readable font sizes, touch-friendly tap targets

**3\. User Types**

Design must account for three distinct user types with different access levels:

| User Type | Access | Notes |
| :---- | :---- | :---- |
| **Guest** | Limited deal feed view only | Install/signup wall triggered via share mechanic — cannot access full app without account |
| **Registered User** | Full app — feed, watchlist, alerts, price history, preferences | Main user type. Google OAuth or email signup. |
| **Admin User** | Separate admin panel only | Separate login, separate table. Cannot access user-facing app via admin credentials. |

**4\. Screens to Design**

The following screens must be designed in Figma. Each screen requires mobile and desktop layouts unless noted otherwise.

| \# | Screen | User Type | Priority |
| :---- | :---- | :---- | :---- |
| **1** | **Landing / Home (Guest View)** | Guest | 🔴 Critical |
| **2** | **Sign Up** | Guest → User | 🔴 Critical |
| **3** | **Login** | Guest → User | 🔴 Critical |
| **4** | **Onboarding — Category Preferences** | New User | 🔴 Critical |
| **5** | **Dashboard / Home (Logged In)** | Registered User | 🔴 Critical |
| **6** | **Deal Feed** | Registered User | 🔴 Critical |
| **7** | **Deal Card (Expanded View)** | Registered User | 🔴 Critical |
| **8** | **Price History Chart** | Registered User | 🔴 Critical |
| **9** | **Watchlist** | Registered User | 🔴 Critical |
| **10** | **Price Drop Alert Notification** | Registered User | 🔴 Critical |
| **11** | **Notification Preferences** | Registered User | 🟡 High |
| **12** | **User Settings / Profile** | Registered User | 🟡 High |
| **13** | **Forgot Password** | Guest | 🟡 High |
| **14** | **Shared Deal Link (Install Wall)** | Guest | 🟡 High |
| **15** | **Admin Panel — Dashboard** | Admin | 🟡 High |
| **16** | **Admin Panel — Deals Management** | Admin | 🟡 High |
| **17** | **Admin Panel — User Management** | Admin | 🟢 Standard |
| **18** | **Admin Panel — Alert Logs** | Admin | 🟢 Standard |

**5\. Screen-by-Screen Requirements**

**Screen 1 — Landing / Home (Guest View)**

*ℹ  First impression screen. Must communicate value immediately — what the app does, why the user should sign up.*

* Hero section: app name, tagline, clear CTA — "Sign Up Free" or "Get Started"

* Brief feature highlights: personalized deals, price drop alerts, watchlist

* Sample deal cards (static/mock) to show what the feed looks like

* Navigation: Logo \+ Sign Up \+ Login buttons

* Mobile: single column, large CTA button. Desktop: split layout with visual

**Screen 2 — Sign Up  /  Screen 3 — Login**

* Email \+ password fields

* Google OAuth button — "Continue with Google" (confirmed for v1)

* Sign Up: name, email, password, confirm password

* Login: email, password, forgot password link

* Link between Sign Up ↔ Login screens

* Clean centered card layout on both mobile and desktop

**Screen 4 — Onboarding: Category Preferences**

*ℹ  This screen runs once after signup. User selects their interests to personalize the deal feed.*

* Grid of category tiles — selectable toggle cards (selected \= highlighted)

* Full category list from client's Replit MVP (to be confirmed at kickoff):

* Amazon Brands, Automotive, Baby, Back to School, Beauty, Books

* Camera & Photo, Cell Phones & Accessories, Computers & Accessories

* Electronics, Everyday Essentials, Fashion, Fitness, Home, Kitchen, Toys

* Deal type preference: Lightning Deals, Limited Time Deals, Prime Day Deals — toggle chips

* Brand preference input — optional free text tags (e.g. Apple, Sony, Nike)

* Price range slider — optional max price filter

* Min discount selector — optional (e.g. 20%+ off only)

* "Save Preferences" CTA — takes user to Dashboard

* "Skip for now" option — takes user to default feed

**Screen 5 — Dashboard / Home (Logged In)**

The main screen after login. Combines a hero section with personalized top deals and quick access to key features.

* Header: logo, search icon, notification bell, avatar/menu

* Hero section: "Top 5 Deals for You Today" — horizontal scroll cards on mobile, grid on desktop

* Watchlist snapshot: 2-3 most recently added watchlist items with current status

* Quick filter tabs: Lightning / Limited Time / Prime Day

* Deal feed below hero — infinite scroll or paginated

* Bottom navigation bar (mobile): Home, Deals, Watchlist, Alerts, Profile

**Screen 6 — Deal Feed**

Full browsable deal feed with filters. Core content screen.

**Deal Card Components — every card must include:**

* Product image (square, from Amazon)

* Product title and brand name

* Current price (large, prominent) \+ original price (strikethrough)

* Discount badge — e.g. "44% OFF" in bold orange

* Star rating \+ review count (e.g. ⭐ 4.5 | 1,203 reviews)

* Countdown timer — "Ends in 9h 52m" with urgency color (red when \< 1hr)

* % claimed indicator — e.g. "67% claimed" with progress bar

* Deal type tag — Lightning / Limited Time / Prime Day chip

* "View Deal" button — links to Amazon

* Share button — icon

* Add to Watchlist button — icon, toggles filled/unfilled

**Feed Controls**

* Category filter tabs — scrollable horizontal chips at top

* Deal type filter tabs — Lightning / Limited Time / Prime Day

* Sort option — highest discount first (default)

* Search bar — searches within current feed

* Pull-to-refresh indicator on mobile

**Screen 7 — Deal Card (Expanded / Detail View)**

Tapped from the feed. Full product detail page.

* Large product image at top

* Full product title, brand, category

* Price section: current price, original price, discount %, deal type badge

* Countdown timer — prominent, large

* % claimed progress bar

* "View Deal on Amazon" CTA — primary button, full width

* "Add to Watchlist" button with target price input field

* Share button

* Price History Chart section (links to Screen 8 or inline)

* Star rating breakdown if available

**Screen 8 — Price History Chart**

*ℹ  This screen helps users judge if a deal is genuinely good or a manipulated price.*

* Line chart — price over time

* Time range toggle: 30 days / 90 days

* Current deal price highlighted as a point on the chart

* "All-time low" badge if current price is the lowest ever recorded — display prominently

* Horizontal reference line at average price

* Clean axis labels — dates on X, price on Y

* Mobile: full width chart, scrollable. Desktop: side by side with deal info

**Screen 9 — Watchlist**

User's personal list of saved keywords and products they're monitoring.

* Add keyword input at top — text field \+ "Add" button

* List of saved watchlist items, each showing:

* Keyword or product name

* Current matched deal (if any) — mini deal card

* Target price set by user

* Price change % since added

* Alert status indicator (active/triggered)

* Per-item controls: edit target price, edit min discount %, remove

* Empty state: friendly illustration \+ "Add your first item" CTA

* "Matched deals" section — deals currently matching watchlist keywords

**Screen 10 — Price Drop Alert Notification**

Push notification and email alert design.

**Push Notification (mobile lockscreen/banner)**

* App icon \+ app name

* Short text: e.g. "Air fryer you wanted just dropped 38% — Limited Time Deal. View now."

* Tap → opens deal detail in app

**In-App Notification / Alert Center**

* Bell icon in header with unread count badge

* Alert list: product name, price change, deal type, timestamp

* Tap alert → opens deal detail

* Mark as read / clear all

**Screen 11 — Notification Preferences**

* Email alerts toggle — on/off

* Push notifications toggle — on/off

* Per-category alert preferences (optional toggles)

* Alert frequency setting: instant / daily digest

* Quiet hours setting — e.g. don't notify between 11pm–7am

**Screen 12 — User Settings / Profile**

* Display name, email

* Change password

* Edit category preferences (links back to onboarding screen)

* Manage notification preferences (links to Screen 11\)

* Delete account option

* Log out

**Screen 13 — Forgot Password**

* Email input field

* "Send Reset Link" button

* Confirmation state: "Check your email" message

* Reset password screen: new password \+ confirm password

**Screen 14 — Shared Deal Link (Install Wall)**

*ℹ  This is the viral growth mechanic. Someone shares a deal link — recipient sees a teaser but must install/sign up to view the full deal.*

* Blurred or partially obscured deal preview

* App branding prominent — Deal Radar logo and name

* CTA: "Install Deal Radar to see this deal" or "Sign up free to view"

* Brief value prop — "Get personalized deals \+ price drop alerts"

* Sign up / Install buttons

* Must feel enticing not annoying — design with care

**Screen 15 — Admin Panel: Dashboard**

* Summary stats: total users, active watchlists, deals in DB, alerts sent today

* Quick action buttons: trigger deal fetch, clear cache

* Recent activity feed: latest deals fetched, alerts fired

* Separate navigation from user-facing app — admin sidebar or top nav

**Screen 16 — Admin Panel: Deals Management**

* Deals table: title, price, discount %, deal type, category, status (active/expired), featured toggle

* Enable / disable individual deals

* Filter by category, deal type, status

* Manually trigger fetch for specific deal type

**Screen 17 — Admin Panel: User Management**

* Users table: name, email, signup date, watchlist count, alert count

* View / deactivate user accounts

* Search by email

**Screen 18 — Admin Panel: Alert Logs**

* Log table: user, product, old price, new price, trigger reason, channel (email/push), timestamp

* Filter by date range, channel, user

**6\. Reusable Component Library**

The following components must be built as reusable Figma components with variants:

* Deal Card — standard \+ expanded variants

* Deal Type Badge — Lightning / Limited Time / Prime Day (3 color variants)

* Discount Badge — e.g. "44% OFF"

* Countdown Timer — normal \+ urgent (red) variants

* Progress Bar — % claimed

* Category Chip / Filter Tab — selected \+ unselected states

* Watchlist Item Row — with and without matched deal

* Notification Bell — with and without badge

* Price History Chart — with all-time low indicator

* Primary Button, Secondary Button, Ghost Button

* Text Input, Password Input, Search Input

* Toggle Switch

* Star Rating Display

* Empty State — with illustration and CTA

* Loading Skeleton — for deal cards and feed

* Toast / Snackbar notification

**7\. Navigation Structure (PWA Web app)**

**Mobile — Bottom Navigation Bar**

* Home (Dashboard)

* Deals (Feed)

* Watchlist

* Alerts

* Profile / Settings

**Desktop — Top Navigation / Sidebar**

* Logo (links to Dashboard)

* Deal Feed

* Watchlist

* Alerts

* Profile dropdown: Settings, Logout

**Admin Panel — Sidebar Navigation**

* Dashboard

* Deals

* Users

* Alert Logs

* Settings

* Logout

**8\. PWA & Mobile Design Requirements**

* All screens must be designed mobile-first at 390px width (iPhone 14 base)

* Desktop breakpoint: 1280px

* Tablet breakpoint: 768px (optional but nice to have)

* Touch targets minimum 44x44px

* Bottom navigation on mobile must not overlap content

* App install prompt UI — browser default is fine, but note placement

* Offline state design — what the user sees when no internet connection

**9\. Visual Direction & Brand Notes**

*ℹ  Final brand colors and typography to be confirmed with client at kickoff. The below is a suggested starting direction based on the project brief.*

**Suggested Color Palette**

* Primary: Deep Navy — communicates trust and value

* Accent: Vibrant Orange — urgency, deals, CTAs, discount badges

* Success/Positive: Green — price drops, savings, all-time lows

* Background: Off-white / Light gray — easy on the eyes for browsing

* Text: Dark gray — avoid pure black for readability

**Typography**

* Headlines: Bold, large, scannable

* Prices: Extra bold, prominent — this is what users look at first

* Countdown timers: Monospace or tabular numerals preferred for clean ticking

* Body text: Regular weight, 14-16px minimum on mobile

**Tone**

* Friendly and energetic — this is a savings app, it should feel exciting

* Not cluttered — resist putting too much on each card or screen

* Deal urgency should feel real not gimmicky — use countdown and badges tastefully

**10\. Design Deliverables**

The following must be delivered in Figma before frontend development begins:

* **All 18 screens — mobile \+ desktop layouts**

* **Component library — all reusable components with variants and states**

* **Clickable prototype — core user flow: Sign Up → Onboarding → Feed → Watchlist → Alert**

* **Design system file — colors, typography, spacing, icons**

* **Dev-ready specs — auto layout, spacing annotations, asset exports**

*⚠  Client will be invited to the Figma file for review. A design approval round with the client must happen before the Frontend phase begins.*

*This document is for internal use only — imCodeZero Design Team.*

![imCodeZero][image3]  imCodeZero  |  imcodezero.com

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgAAABICAYAAABV7bNHAAADKElEQVR4Xu2csXEcORBF6YzPEDYEhbAhMAT6dBTCGvQVAkNgCBsCXXkMQSFQMzJUxAPQv4HBzPSy+Kqec6cG6z+dSpSq9u7uvrlhnp8+PvnKf/1lmH6/nmY/SvLHJqSBav7k2U3AEDV5l5DHUJ74RDgYQMn7hDyA13c+dTgc7pXvJOTD2z0aDm6V7yVwbK9HwbE98s0EDl3nG5/fjHnYPYf2yrcT8pHr3Zp51AtHrpHvJ3DcKLdiGhxnkV8jgcNGOppp4C+rz/LruODYPv/w2VVwWIfbfG+SD2/xns91URjrlm9twvIddD7e51o4uMEr39ocjve6hsJwKd/YFY732feTyeEe+cYh5AG0rcxjzxzv8IXvHAYDaNt+VyuMl/KNQ3l+eihEsG2B45W8DwEDKL1wvEe+EQZGUHrgeCXvQ8EASg8MoOR9KJa/XWQESwXHK3kfEkaw/cHzBAZQ8j4keQRbCwZQ8j4kDKCsMQ9+ZABL3oeGESxrMICS96FhBMsaDKDkfWgYwbIGAyh5HxpGsKzBAMIL70PDCLZnnv+jEKEqb8OTR7C88nyJc2YES96HJ49gS+bRV0aw5H14GEBJGEDJ+/AwgJIwgJL34WEAJWEAJe/DwwBKwgBK3oeHAZSEAZS8Dw8D2BZ/m88iWPI+PHkEyzPPl0DvjGDJ+/DkEeqWmL6/UbQDLTCCJW/DwwiWNRjBkrehYQBlDUYQnngfFgZQ1ihEMOV9WBjA9sLz/zCAkvdhySPUtWAAJe9DwgBKBSNY8jYkDKBUMIKS9+FgAKWCAZS8DwXHKz3Mo38xgvDCN8LAAEovhQimvA8Bx2sf+EQVBnD4yDcOJw9g28LU8bEDvnEoHO+xFQbwyDcOg+OVPUwd/xVNEX6pcbzHXgoBPI75gEgPHO5xLYUAHvf7+OPC8qkdDvc4gqnxbxo/y7eG0xtmZKAFDu9w7P9WgkN7HE1h9Aiv/DoJHDXKrSgMXOv+gbamMHKN+wbai8LQXvcLtDeFsT3uE+goCoNb3TrQiU8eQmG4160CtX16cC8KAZRjA90ShRgl1wf6KkzlP7J4Al34j78JxF99R1MsXrG4BAAAAABJRU5ErkJggg==>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAB1ElEQVR4Xu3XsW3bQBSAYTXuM5JGyAjp2WgEFewzSkbICG7TZQSN4JAHWJC+e+QdKZ4EwvmBv/J7h/9JgGEfDv85HN7+/Po2+PGpP0/03Ufoq7gNVmcThkc+A2Mj3UkYO2crDJ3SvYSRJbfEwJLuJwys86/PLMa4Gn0jkcfVuxbDavWdDANrXIpRc7q7CEOnXIqRke48hMGRtRga6c4mGBxZYog7GqvubIrBWsJYdX5z+u6SRescBqvzTTBYpzBWnW9G371n0bs6YMRojTBYnW+KwSrGqvPNMVjFYHW+OX13yqJ3dcCI0V/5gN/OPwWj7z3ezQbRr/30R/LoW8/XuSHyZPTeDjgbvYMDTte5XR5wy1vhT+i74Wdi9NQBI0a//IDxt4zRaw8Y/O58cwxWCaJf+y0YrGKwOt8cg1UMVuebY/Bc/IjB6nxTDNYpjFbnm2GwTmGwOt+EvvuRBd/705UrBke6szl5cN2n/4nB6vymGBtZwuBIdzbDWK3F4Eh3HsbY3Isrsxgc6c4q8tDYpRhb8Oj+LOM/IwbOuZYgtErfSRhV66MYV6NvJAyrcSsMLOl+wriSLTB0SvcSBs7ZkiHwYrC6kzAy992V5hi+4oCzY1+OfzESKxrlXQimAAAAAElFTkSuQmCC>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAYAAACpSkzOAAAAmUlEQVR4Xu3NsQ2AMAwFURr2YAT2yhIU2Yd12CZAgQRHonw7QMVJbmLFr+u8xTDxyV2/zOk8l2UM6TaeiEiQBeRxF6RgPJ5FGJEaxuNVgBHKYQTMyJEV4l7uQ2gsYkSaoD0VOn3x9UPufsidCjVhRGIYLvvXIPYIRESBXFgNOSIkYwRq0B6hIsqjHCUCZsgSEQl6og2a+GZpBQrcC2KKHd6yAAAAAElFTkSuQmCC>