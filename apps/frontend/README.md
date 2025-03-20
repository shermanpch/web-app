# Modern Next.js Web Application Template

A clean, modern UI template for building web applications with Next.js and Tailwind CSS. This template provides a solid foundation for creating beautiful, responsive web applications with best practices.

## Features

- Responsive design that works on mobile and desktop
- Dark mode by default with Tailwind
- Modern UI with a clean, accessible design
- Server-side rendered with Next.js App Router
- TypeScript for type safety
- Component-based architecture
- Reusable UI components (Button, Card, Container)
- Organized project structure for scalability

## Getting Started

### Prerequisites

- Node.js 16.8 or later
- npm or yarn

### Installation

1. Clone the repository
2. Install the dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Project Structure

```
app/
├── components/
│   ├── layout/        # Structural components (Header, Footer)
│   ├── ui/            # Reusable UI components (Card, Container)
│   ├── sections/      # Page sections (Hero, Features, Testimonials)
├── config/            # App configuration
│   ├── index.ts       # General config
├── globals.css        # Global styles
├── layout.tsx         # Root layout
├── page.tsx           # Home page
```

## Customization

### Theme

Update the colors and other design tokens in `tailwind.config.ts`.

### Content

Replace the placeholder content in the components with your own:

- Update the logo in `public/assets/`
- Modify the navigation links in `app/config/index.ts`
- Update the sections in `app/components/sections/` with your own content

## Built With

- [Next.js](https://nextjs.org/) - The React framework
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript

## License

This project is available as open source under the terms of the MIT License.

---

Happy coding! 🚀 