# Athletic Freedom Mock DM Bot 2.0

A modern chat application built with Next.js 14, TypeScript, and OpenAI Assistants API. This application provides a training environment for appointment setters, where an AI assistant evaluates the setter's performance while roleplaying as a prospect.

## Features

- 🤖 **OpenAI Assistants API Integration** - Uses a configured assistant for intelligent responses
- 💬 **Real-time Chat Interface** - Modern, polished UI with smooth animations
- 📊 **Evaluation System** - AI evaluates setter performance in real-time
- 🎭 **Roleplay Scenarios** - Multiple scenarios for training different situations
- 🎨 **Modern UI** - Clean, professional design with responsive layout

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **OpenAI SDK** (Assistants API)
- **Tailwind CSS**
- **React Hooks**

## Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd MockDM
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. Start by sending "1", "2", or "3" to generate a scenario
2. The assistant will provide a scenario and begin roleplaying as the prospect
3. Your messages will be evaluated in real-time
4. The assistant provides feedback on your appointment-setting skills

## Project Structure

```
MockDM/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts      # API route for OpenAI Assistants
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main chat interface
├── .env.local                # Environment variables (not committed)
├── .gitignore
├── package.json
├── README.md
└── tsconfig.json
```

## Important Notes

- **API Key Security**: Never commit your `.env.local` file. It's already in `.gitignore`
- **Assistant ID**: The assistant ID is configured in `/app/api/chat/route.ts`
- **SSL Certificate**: The app includes SSL certificate handling for development environments

## Development

- **Build for production**: `npm run build`
- **Start production server**: `npm start`
- **Lint code**: `npm run lint`

## License

Private project - All rights reserved

