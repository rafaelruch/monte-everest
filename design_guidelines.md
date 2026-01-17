# Monte Everest Design Guidelines

## Design Approach
**Reference-Based**: Drawing from Upwork's professional marketplace aesthetics, Airbnb's trust-building UI patterns, and Thumbtack's service category showcases. Focus on credibility, clear service discovery, and seamless provider-client connections.

## Core Design Principles
- Professional marketplace credibility
- Service-first visual hierarchy
- Trust through transparency
- Brazilian market cultural alignment

---

## Typography System
**Primary Font**: Inter (Google Fonts)
**Secondary Font**: Poppins (headings, bold statements)

**Hierarchy**:
- Hero Headlines: Poppins Bold, 3.5rem (desktop) / 2.25rem (mobile)
- Section Headers: Poppins SemiBold, 2.5rem / 1.75rem
- Subheadings: Inter SemiBold, 1.25rem / 1.125rem
- Body Text: Inter Regular, 1rem / 0.9375rem
- Captions/Meta: Inter Regular, 0.875rem

---

## Layout System
**Spacing Units**: Use Tailwind units 3, 4, 6, 8, 12, 16, 20, 24 for consistent rhythm
**Container**: max-w-7xl for main content, max-w-6xl for text-heavy sections
**Grid**: 12-column responsive grid (lg:grid-cols-3 for services, md:grid-cols-2, base: single column)

---

## Component Library

### Navigation
**Desktop**: Horizontal nav with logo left, search center, CTA right
**Components**: Logo, Category dropdown, Search bar (prominent), "List Your Service" CTA, Login/Profile
**Sticky**: Yes, with subtle shadow on scroll

### Hero Section
**Layout**: Full-width image background (80vh) with centered content overlay
**Elements**: 
- Large headline + supporting subtext
- Search bar (category + location inputs)
- Trust indicators (e.g., "50,000+ verified providers")
- Buttons with backdrop-blur-md background

### Service Category Cards
**Grid**: 3-4 columns desktop, 2 tablet, 1 mobile
**Card Structure**: 
- Category icon/image (rounded corners)
- Category name (bold)
- Service count
- Hover: Subtle lift (translate-y-1) + shadow increase

### Featured Provider Cards
**Layout**: Horizontal scroll carousel (desktop), stack (mobile)
**Card Elements**:
- Provider photo (circular, 80px)
- Name + verification badge
- Star rating + review count
- Service category tags
- Starting price
- "View Profile" CTA

### How It Works Section
**Layout**: 3-column process timeline
**Each Step**: 
- Large number indicator
- Icon
- Step title
- Brief description

### Trust/Stats Section
**Layout**: 4-column grid of metrics
**Components**: 
- Large number (count-up animation)
- Metric label
- Supporting icon

### Testimonials
**Layout**: 2-column grid with alternating image placement
**Elements**:
- Client photo (square, medium)
- Quote text (larger, italic)
- Name + service used
- Star rating

### CTA Section
**Layout**: Full-width background with centered content
**Elements**:
- Bold headline
- Supporting text
- Dual CTAs (primary: "Get Started", secondary: "Become a Provider")

### Footer
**Layout**: 4-column grid
**Sections**: 
- Company info + logo
- Quick links (Services, About, Help)
- Provider resources
- Contact + social icons
**Bottom**: Copyright + language selector (PT/EN)

---

## Images

**Hero Image**: Wide-angle shot of diverse Brazilian professionals (handyman, cleaner, tutor, photographer) in action, bright natural lighting, professional yet approachable. Subtle blue overlay (#3C8BAB at 15% opacity).

**Category Cards**: Icon-style illustrations or real photography for each service category (home repair, cleaning, tutoring, photography, etc.)

**Featured Providers**: Professional headshots with neutral/bright backgrounds

**How It Works**: Simple line icons (search, book, complete) - use Heroicons

**Testimonials**: Authentic client photos (diverse ages, casual professional settings)

---

## Page Structure (Landing)

1. **Navigation** (sticky)
2. **Hero** (80vh with large background image)
3. **Search/Category Grid** (py-20)
4. **Featured Providers** (py-16, light background)
5. **How It Works** (py-20)
6. **Stats/Trust Section** (py-16, blue background tint)
7. **Testimonials** (py-20)
8. **Provider CTA** (py-24, background image with overlay)
9. **Footer** (py-12)

---

## Animations
Minimal and purposeful:
- Hero search bar: Subtle scale on focus
- Cards: Gentle hover lift (150ms ease)
- Stats: Count-up on viewport entry (once)
- NO scroll-triggered parallax or complex transitions