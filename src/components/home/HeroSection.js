import { signIn } from 'next-auth/react';
import { Button, Card, CardBody, Image } from '@nextui-org/react';
import { SparklesIcon } from '@heroicons/react/24/outline';

export function HeroSection({ currentAlbum, isTransitioning }) {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Gradient orb effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-background to-background" />
      
      <div className="container mx-auto px-6 py-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl font-bold tracking-tight">
                Discover your <span className="text-primary">perfect</span> daily track
              </h1>
              <p className="mt-6 text-lg text-gray-300">
                Get a personalized song recommendation every day, intelligently curated based on your Spotify listening patterns.
              </p>
            </div>

            <Button 
              color="primary"
              variant="shadow"
              size="lg"
              startContent={<SparklesIcon className="h-5 w-5" />}
              onClick={() => signIn('spotify')}
              className="font-semibold"
            >
              Continue with Spotify
            </Button>
          </div>

          <Card 
            className="bg-default-100/50 backdrop-blur-sm border-1 border-white/20"
            isBlurred
          >
            <CardBody>
              <div className={`transition-opacity duration-800 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                <Image
                  src={currentAlbum.url}
                  alt={`${currentAlbum.name} by ${currentAlbum.artist}`}
                  className="object-cover rounded-lg"
                />
                <div className="mt-4 space-y-2">
                  <h3 className="text-lg font-semibold">{currentAlbum.name}</h3>
                  <p className="text-gray-400">{currentAlbum.artist}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
} 