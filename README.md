# Seer AI News Platform

A modern, responsive AI news aggregation platform built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Features

### Core Functionality
- **Landing Page** - Clean, modern design with compelling copy and clear CTAs
- **Onboarding Flow** - Multi-step personalization with role selection, industry preferences, and content types
- **Dashboard** - Horizontal scrolling story cards with full-width layout
- **Show All Stories** - Expandable view with advanced filtering (Source, Content Type, Industry, Category)
- **Chat Interface** - AI-powered chat with quick actions and conversation history
- **Saved Stories** - Collection-based organization with horizontal story cards
- **Profile Management** - Minimalist user settings and preferences

### Design System
- **Modern Typography** - Enhanced Inter font with OpenType features
- **Seer Brand Colors** - Teal (#39C0C8) primary color with consistent theming
- **Smooth Animations** - Fade-in effects, hover states, and micro-interactions
- **Responsive Layout** - Works seamlessly across desktop, tablet, and mobile
- **Glass Morphism** - Backdrop blur effects and modern card designs

## 🛠 Tech Stack

- **Framework**: Next.js 15.5.4 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v3
- **Icons**: Lucide React
- **Deployment**: Static export ready

## 📦 Installation

1. **Extract the archive**:
   ```bash
   tar -xzf seer-platform-complete.tar.gz
   cd seer-platform
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   ```
   http://localhost:3000
   ```

## 🏗 Project Structure

```
seer-platform/
├── src/
│   ├── app/
│   │   ├── globals.css          # Global styles and Tailwind imports
│   │   ├── layout.tsx           # Root layout component
│   │   ├── page.tsx             # Landing page
│   │   ├── onboarding/
│   │   │   └── page.tsx         # Multi-step onboarding flow
│   │   ├── dashboard/
│   │   │   └── page.tsx         # Main dashboard with story cards
│   │   ├── chat/
│   │   │   └── page.tsx         # AI chat interface
│   │   ├── saved/
│   │   │   └── page.tsx         # Saved stories with collections
│   │   └── profile/
│   │       └── page.tsx         # User profile settings
├── public/                      # Static assets
├── package.json                 # Dependencies and scripts
├── tailwind.config.js          # Tailwind configuration
├── next.config.js              # Next.js configuration
└── tsconfig.json               # TypeScript configuration
```

## 🎨 Design System

### Colors
```css
/* Primary Brand Colors */
--seer-teal: #39C0C8
--seer-teal-hover: #2DA5AD
--seer-light-teal: #E6F7F8
--seer-dark-teal: #1A5F63

/* Slate Palette */
--slate-50: #F8FAFC
--slate-100: #F1F5F9
--slate-600: #475569
--slate-900: #0F172A
```

### Typography
- **Primary Font**: Inter with enhanced OpenType features
- **Monospace**: JetBrains Mono for code elements
- **Font Weights**: 300-900 for proper hierarchy

### Components
- **seer-btn-primary**: Primary action buttons
- **seer-btn-secondary**: Secondary action buttons  
- **seer-btn-ghost**: Subtle action buttons
- **seer-card**: Standard card component
- **seer-card-interactive**: Hoverable card component
- **seer-input**: Form input styling
- **seer-nav-item**: Navigation item styling
- **story-card-horizontal**: Horizontal story card layout

## 📱 Pages Overview

### Landing Page (`/`)
- Hero section with value proposition
- Feature highlights
- Call-to-action buttons
- Professional footer

### Onboarding (`/onboarding`)
- **Step 1**: Role selection (6 professional roles)
- **Step 2**: Industry preferences (multi-select)
- **Step 3**: Content type preferences (multi-select)
- Custom preferences input throughout
- Previous/Next navigation

### Dashboard (`/dashboard`)
- Personalized story feed
- Horizontal scrolling story cards
- Search and filter functionality
- "Show All Stories" with advanced filters
- Stats cards and trending indicators

### Chat (`/chat`)
- AI conversation interface
- Quick action sidebar
- Message history
- Professional chat design

### Saved Stories (`/saved`)
- Collection-based organization
- Same horizontal cards as dashboard
- Advanced search and filtering
- Create custom collections
- Notes and rating system

### Profile (`/profile`)
- User information management
- Notification preferences
- Account settings
- Activity statistics

## 🔧 Development

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Environment Setup
No environment variables required for basic functionality. All data is currently mocked for prototype purposes.

### Customization
- **Colors**: Update `tailwind.config.js` and `globals.css`
- **Typography**: Modify font imports in `layout.tsx`
- **Components**: Extend existing component classes in `globals.css`

## 🚀 Deployment

### Static Export
The project is configured for static export:

```bash
npm run build
```

This generates an `out/` directory with static files ready for deployment to any static hosting service.

### Deployment Platforms
- **Vercel**: Automatic deployment with Git integration
- **Netlify**: Drag-and-drop or Git-based deployment
- **AWS S3**: Static website hosting
- **GitHub Pages**: Free hosting for public repositories

## 📊 Data Integration

### Mock Data Structure
All components use TypeScript interfaces for type safety:

```typescript
interface Story {
  id: string
  title: string
  summary: string
  source: string
  readTime: string
  publishedAt: string
  category: string
  tags: string[]
  relevanceScore: number
  trending: boolean
  url: string
}
```

### API Integration Points
- Replace mock data arrays with API calls
- Update form submissions to send to backend
- Implement real-time updates for trending stories
- Add authentication for user-specific features

## 🎯 Future Enhancements

### Backend Integration
- User authentication and profiles
- Real news API integration
- Personalization algorithms
- Save/bookmark functionality
- Collection management

### Advanced Features
- Push notifications
- Email newsletters
- Social sharing
- Advanced analytics
- Multi-language support

## 📄 License

This project is a prototype/demo application. Customize and use as needed for your specific requirements.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For questions or issues with the codebase, refer to:
- Next.js documentation: https://nextjs.org/docs
- Tailwind CSS documentation: https://tailwindcss.com/docs
- TypeScript documentation: https://www.typescriptlang.org/docs

---

**Built with ❤️ using Next.js, TypeScript, and Tailwind CSS**
