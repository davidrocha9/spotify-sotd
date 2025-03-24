# Spotify Song of the Day

A personalized web application that recommends a daily song from Spotify based on your listening history. Get a fresh music recommendation every day, view your past recommendations in a calendar view, and create Spotify playlists from your song history.

## Features

- **Daily Song Recommendations**: Receive a new song recommendation each day based on your Spotify listening history
- **Song Details**: View comprehensive information about each recommended song including album, artist, and popularity
- **History Calendar**: Browse your past recommendations in an intuitive calendar view
- **Playlist Creation**: Create Spotify playlists from your monthly song recommendations with one click

## Technologies Used

- **Next.js** - React framework for server-rendered applications
- **NextAuth.js** - Authentication for Next.js applications
- **Spotify Web API** - Access to Spotify's music data and user information
## Getting Started

### Prerequisites

- Node.js 14.x or higher
- A Spotify account
- A Spotify Developer application

### Setting Up Your Spotify Developer Application

1. Visit the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Log in with your Spotify account
3. Create a new application
4. Note your Client ID and Client Secret
5. Add `http://localhost:3000/api/auth/callback/spotify` to your Redirect URIs in the app settings

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/spotify-song-of-day.git
   cd spotify-song-of-day
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXTAUTH_URL=http://localhost:3000
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   NEXTAUTH_SECRET=generate_a_random_string_here
   HUGGINGFACE_API_KEY=your_huggingface_api_key_if_using
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Home Page**: Click "Connect with Spotify" to authorize the application
2. **Dashboard**: View your song of the day recommendation
3. **History**: Browse your past recommendations in a calendar view and create monthly playlists

## Deployment

The easiest way to deploy this application is using Vercel:

1. Push your code to a GitHub repository
2. Import your project into Vercel
3. Add your environment variables in the Vercel dashboard
4. Deploy

When deploying to production, make sure to:
1. Update your Spotify Developer application with the production callback URL
2. Set the `NEXTAUTH_URL` to your production URL

## Environment Variables

- `NEXTAUTH_URL`: The base URL of your application (e.g., http://localhost:3000 for development)
- `SPOTIFY_CLIENT_ID`: Your Spotify application Client ID
- `SPOTIFY_CLIENT_SECRET`: Your Spotify application Client Secret
- `NEXTAUTH_SECRET`: A random string used to encrypt cookies (generate with `openssl rand -base64 32`)
- `HUGGINGFACE_API_KEY`: Your Hugging Face API key (optional, for AI descriptions)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Spotify Web API for providing access to music data
- NextAuth.js for simplifying authentication
- All the contributors who have helped improve this project

---

Happy listening! 🎵 