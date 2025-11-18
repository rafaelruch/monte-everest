# Monte Everest Professional Profile Design Guidelines

## Design Approach
**Reference-Based**: Drawing from LinkedIn (professional credibility), Upwork (marketplace trust signals), and modern portfolio sites. Creating a conversion-focused profile that builds trust while showcasing professional expertise.

## Typography System
- **Primary Font**: Inter (Google Fonts) - clean, professional, excellent readability
- **Headings**: Semi-bold (600) for hierarchy, sizes: 3xl for name, 2xl for sections, xl for subsections
- **Body**: Regular (400) for descriptions, Medium (500) for emphasis
- **Accents**: Tight letter-spacing for professional sections, relaxed for testimonials

## Layout & Spacing
**Spacing Units**: Tailwind 4, 6, 8, 12, 16 for consistent rhythm
- Mobile: py-8, px-4 for sections
- Desktop: py-16, px-6 for sections
- Card padding: p-6
- Element gaps: gap-6 for grids, gap-4 for lists

**Container**: max-w-5xl mx-auto for content width, full-width hero

## Page Structure (Top to Bottom)

### 1. Hero Profile Section (Full-width, ~400px height)
Professional header image with overlay containing:
- Large profile photo (circular, 120px, positioned over background with border)
- Professional name (3xl, bold)
- Title/specialty (xl)
- Location with icon
- Rating stars + review count
- Primary CTA button ("Contact Professional" - blurred background)
- Secondary action ("Share Profile")

### 2. Quick Stats Bar
Horizontal cards grid (grid-cols-4 on desktop, grid-cols-2 mobile):
- Years Experience
- Projects Completed  
- Response Time
- Success Rate
Each stat with large number, small label, subtle icon

### 3. About Section
Two-column layout (desktop):
- Left: Professional bio (max-w-prose)
- Right: Key Skills tags (pill-style badges, wrapped grid)

### 4. Services Offered
Card grid (grid-cols-3 desktop, grid-cols-1 mobile):
Each service card includes:
- Service name (bold)
- Brief description
- Starting price indicator
- Duration estimate
- "Request Quote" button

### 5. Portfolio/Work Examples
Masonry-style grid (3 columns desktop, 1 mobile):
- Project images with hover overlay showing title
- Mix of aspect ratios for visual interest
- "View All Work" button at bottom

### 6. Client Testimonials
Two-column grid (stacks mobile):
Each testimonial card:
- Client photo (small circular)
- Name + project type
- Star rating
- Quote text
- Project completion date

### 7. Availability & Contact
Split section:
- Left: Calendar-style availability indicator
- Right: Contact form (Name, Email, Message, Submit)
Footer includes response time commitment

## Component Specifications

**Cards**: Rounded corners (rounded-lg), subtle shadow, white background, hover lift effect
**Buttons**: 
- Primary: Solid with blur backdrop when over images
- Secondary: Outline style
- Sizes: px-6 py-3 for primary actions
**Icons**: Heroicons via CDN, 20px for inline, 24px for standalone
**Badges/Tags**: pill shape (rounded-full), px-4 py-1.5
**Images**: rounded-lg, aspect ratios maintained, lazy loading

## Images Required

1. **Hero Background**: Wide professional workspace/industry scene (1920x400px), subtle overlay for text readability
2. **Profile Photo**: High-quality professional headshot (square, minimum 400x400px)
3. **Portfolio Images**: 6-9 work examples showcasing variety (various sizes, minimum 600px width)
4. **Client Photos**: Small headshots for testimonials (100x100px each, 4-6 testimonials)

## Accessibility
- Semantic HTML structure (header, main, sections)
- All images with descriptive alt text
- Form labels properly associated
- Sufficient color contrast ratios
- Focus states on all interactive elements
- ARIA labels for icon-only buttons

## Responsive Behavior
- Mobile-first approach
- Hero scales proportionally, text remains readable
- Grid systems collapse: 3-col → 1-col, 2-col → 1-col
- Stats bar: 4-col → 2-col grid
- Touch-friendly tap targets (minimum 44px)
- Sticky "Contact" button on mobile scroll