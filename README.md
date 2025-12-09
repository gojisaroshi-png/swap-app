# Crypto Swap App

A beautiful, dark-themed cryptocurrency swap interface built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui.

## Features

- Dark mode by default with elegant gradients
- Smooth animations using Framer Motion
- Token selection with dropdown menus
- Animated swap position functionality
- Fully responsive design
- Built with TypeScript for type safety
- shadcn/ui components with Tailwind CSS

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
swap/
├── app/
│   ├── globals.css          # Global styles with dark theme variables
│   ├── layout.tsx           # Root layout with dark mode enabled
│   └── page.tsx             # Main page with swap card
├── components/
│   └── ui/
│       ├── button.tsx       # Button component
│       ├── card.tsx         # Card component
│       ├── input.tsx        # Input component
│       ├── dropdown-menu.tsx # Dropdown menu component
│       └── swap-card.tsx    # Main swap card component
├── lib/
│   └── utils.ts             # Utility functions (cn)
├── tailwind.config.ts       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
├── components.json          # shadcn/ui configuration
└── package.json             # Project dependencies
```

## Components

### SwapCard

The main component that handles token swapping with the following features:

- Token selection for buy/sell
- Amount input with USD value display
- Animated position swapping
- Tab navigation (Swap, Send, Buy)
- Max button for sell panel

## Technologies Used

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Framer Motion** - Animations
- **Radix UI** - Primitive components
- **lucide-react** - Icons

## Customization

### Adding More Tokens

Edit the `tokens` array in [app/page.tsx](app/page.tsx):

```typescript
const tokens: Token[] = [
  {
    symbol: "ETH",
    name: "Ethereum",
    icon: Coins,
  },
  {
    symbol: "AAVE",
    name: "Aave",
    icon: PiggyBank,
  },
  // Add more tokens here
];
```

### Changing Theme Colors

Edit the CSS variables in [app/globals.css](app/globals.css) under the `.dark` class.

## Why /components/ui?

The `/components/ui` folder is the standard location for shadcn/ui components. This structure:

- Keeps UI primitives separate from business logic components
- Makes it easy to update components via shadcn CLI
- Follows the shadcn/ui convention for better compatibility
- Allows for easy component sharing across projects

## License

MIT
