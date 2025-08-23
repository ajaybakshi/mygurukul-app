# MyGurukul - Spiritual Q&A App

A beautiful, mobile-first spiritual Q&A application built with Next.js 14, TypeScript, and Tailwind CSS. Powered by Google Discovery Engine API for AI-powered spiritual guidance.

## 🌟 Features

### ✨ Beautiful Spiritual Design
- **Golden Color Scheme**: Warm spiritual colors (#D4AF37, #8B4513)
- **Mobile-First**: Optimized for mobile devices with bottom navigation
- **Responsive Layout**: Beautiful cards and gradients throughout
- **Typography**: Enhanced with @tailwindcss/typography for spiritual content

### 🤖 AI-Powered Spiritual Guidance
- **Google Discovery Engine Integration**: Real-time spiritual wisdom from sacred texts
- **Rich Responses**: Complete answers with citations and references
- **Enhanced Formatting**: Beautiful typography for spiritual content display
- **Error Handling**: Comprehensive error handling and loading states

### 📱 Mobile Experience
- **Bottom Navigation**: Easy thumb access to all sections
- **Touch-Friendly**: Optimized for mobile interaction
- **Responsive Design**: Works perfectly on all screen sizes
- **Fast Loading**: Optimized performance with Next.js 14

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom spiritual theme
- **Icons**: Lucide React
- **AI Integration**: Google Discovery Engine API
- **Authentication**: Google Cloud Service Account
- **Typography**: @tailwindcss/typography

## 📁 Project Structure

```
mygurukul-app/
├── src/
│   ├── app/
│   │   ├── globals.css          # Global styles and Tailwind imports
│   │   ├── layout.tsx           # Root layout with bottom navigation
│   │   ├── page.tsx             # Home page
│   │   ├── submit/
│   │   │   └── page.tsx         # Question submission with AI integration
│   │   ├── history/
│   │   │   └── page.tsx         # Question history page
│   │   ├── profile/
│   │   │   └── page.tsx         # User profile page
│   │   └── api/
│   │       └── discovery-engine/
│   │           └── route.ts     # Secure API route for Discovery Engine
│   ├── components/
│   │   ├── BottomNavigation.tsx # Mobile bottom navigation
│   │   └── AIResponse.tsx       # AI response display component
│   └── lib/
│       └── discoveryEngine.ts   # Google Discovery Engine API service
├── tailwind.config.js           # Tailwind configuration with spiritual theme
├── tsconfig.json               # TypeScript configuration
├── next.config.js              # Next.js configuration
└── package.json                # Dependencies and scripts
```

## 🎯 Key Features

### Mobile-First Design
- Responsive layout optimized for mobile devices
- Touch-friendly interface elements
- Bottom navigation for easy thumb access
- Proper viewport meta tags

### Spiritual Theme
- Custom color palette with warm golds and browns
- Gradient backgrounds and card shadows
- Typography optimized for spiritual content
- Iconography that reflects the app's purpose

### AI-Powered Spiritual Guidance
- **Full Spiritual Responses**: Complete, compassionate answers from sacred texts
- **Rich Citations**: Multiple source references with proper attribution
- **Enhanced Typography**: Beautiful formatting for spiritual content
- **Comprehensive References**: Detailed source information and further reading
- **Real-time Processing**: Live API integration with Google Discovery Engine

### User Experience
- Smooth transitions and hover effects
- Loading states and form validation
- Intuitive navigation patterns
- Accessible design considerations
- AI-powered responses with citations
- Error handling and retry mechanisms

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mygurukul-app
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. **Configure Google Discovery Engine API**:
   Set up environment variables in your `.env.local` file:
   ```bash
   # Google Cloud Service Account Credentials
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   GOOGLE_CLOUD_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
   GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Private Key Here\n-----END PRIVATE KEY-----\n"
   # Answer API endpoint (uses :answer suffix for synthesized responses)
   GOOGLE_DISCOVERY_ENGINE_ENDPOINT=https://discoveryengine.googleapis.com/v1alpha/projects/516647012587/locations/global/collections/default_collection/engines/mygurukul_1755255323297/servingConfigs/default_search:answer
   ```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Customization

### Colors
Edit `tailwind.config.js` to modify the spiritual color palette:
```javascript
colors: {
  spiritual: {
    50: '#FDF8E1',
    500: '#D4AF37', // Primary gold
    950: '#8B4513', // Deep brown
  }
}
```

### Typography
The app uses @tailwindcss/typography with custom spiritual theme:
```javascript
typography: {
  spiritual: {
    css: {
      '--tw-prose-body': '#8B4513',
      '--tw-prose-links': '#D4AF37',
      // ... more customizations
    }
  }
}
```

## 🌐 API Integration

### Google Discovery Engine Answer API
- **Authentication**: Service account credentials via environment variables
- **Endpoint**: Answer API endpoint via `GOOGLE_DISCOVERY_ENGINE_ENDPOINT` (uses `:answer` suffix)
- **Response Format**: Synthesized, conversational spiritual responses with citations and references
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **API Type**: Answer API (not Search API) for compassionate, flowing spiritual guidance

### API Response Structure
```typescript
interface DiscoveryEngineResponse {
  answer: {
    state: string;           // SUCCEEDED, PROCESSING, etc.
    answerText: string;      // Full spiritual response
    citations: Array<...>;   // Multiple source references
    references: Array<...>;  // Detailed source info
    steps: Array<...>;       // Processing steps
  };
}
```

## 📱 Pages

### Home (`/`)
- Welcome banner with spiritual messaging
- Quick action cards for common tasks
- Daily wisdom section
- Recent questions display

### Submit (`/submit`)
- Question submission form with categories
- Real-time AI response integration
- Loading states and error handling
- Guidelines for spiritual questions

### History (`/history`)
- User's question history
- Status tracking (answered/pending)
- View counts and timestamps
- Empty state with call-to-action

### Profile (`/profile`)
- User information and stats
- Settings and preferences
- Notification controls
- Account management

## 🎨 Design System

### Color Palette
- **Primary Gold**: #D4AF37 (spiritual-500)
- **Deep Brown**: #8B4513 (spiritual-950)
- **Light Gold**: #FDF8E1 (spiritual-50)
- **Warm Browns**: Various shades for depth

### Typography
- **Font Family**: Inter (Google Fonts)
- **Headings**: Bold, spiritual-950
- **Body Text**: Regular, spiritual-800
- **Captions**: Small, spiritual-600

### Components
- **Cards**: White background with spiritual shadows
- **Buttons**: Spiritual gradient with hover effects
- **Navigation**: Bottom navigation with active states
- **Forms**: Clean inputs with spiritual focus states

## 🔒 Security

### Environment Variables
- All sensitive credentials stored in `.env.local`
- No hardcoded API keys or secrets
- Service account authentication for Google Cloud
- Secure API route proxying

### API Security
- Server-side only API calls
- Request validation and sanitization
- Timeout protection (30 seconds)
- Comprehensive error handling

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
Ensure all required environment variables are set in production:
- `GOOGLE_CLOUD_PROJECT_ID`
- `GOOGLE_CLOUD_CLIENT_EMAIL`
- `GOOGLE_CLOUD_PRIVATE_KEY`
- `GOOGLE_DISCOVERY_ENGINE_ENDPOINT`

### Vercel Deployment
The app is optimized for Vercel deployment with:
- Automatic static optimization
- Edge functions for API routes
- Environment variable management
- Automatic HTTPS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Google Discovery Engine**: For AI-powered spiritual guidance
- **Next.js Team**: For the amazing framework
- **Tailwind CSS**: For the utility-first CSS framework
- **Lucide**: For beautiful icons
- **Sacred Texts**: For the spiritual wisdom that powers this app

---

**MyGurukul** - Your spiritual journey begins here. 🌟
