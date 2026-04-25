# KVO Nagpur Heritage Portal

Connecting Our Heritage, Building Our Future.

A vibrant digital tapestry for the KVO Nagpur community, standing as custodians of legacy and empowering generations through unity. This portal serves as a central hub for members to connect, stay updated on community events, and access the rich archives of our shared history.

## 🌟 Key Features

- **Member Directory**: A secure space for members to connect and manage their profiles.
- **Event Management**: Stay informed about upcoming community gatherings, global chapter meets, and cultural celebrations.
- **Heritage Archives**: Honoring the contributions and impact of individuals who inspire the future of the Samaj.
- **Admin & Committee Dashboard**: Specialized tools for community leaders to manage memberships and organize initiatives.
- **Dynamic UX**: Modern, responsive interface with parallax effects and smooth animations.

## 🚀 Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Frontend**: [React 19](https://react.dev/), [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Authentication)
- **Styling**: Vanilla CSS Modules for precise control and performance.

## 🛠️ Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Samit16/cep-project.git
   cd cep-project
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add your Supabase credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `src/app`: Next.js App Router pages and API routes.
- `src/components`: Reusable UI components and page sections.
- `src/hooks`: Custom React hooks for animations and state management.
- `src/lib`: Core utility functions, API clients, and auth context.
- `src/types`: TypeScript definitions for project-wide data structures.
- `supabase/`: Database migrations and configuration.

## 📄 License

Established since 1921. KVO Nagpur.
