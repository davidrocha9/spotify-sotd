import { Card, CardBody } from '@nextui-org/react';
import { 
  FingerPrintIcon, 
  CalendarDaysIcon, 
  BoltIcon 
} from '@heroicons/react/24/outline';

const features = [
  {
    icon: FingerPrintIcon,
    title: "Personalized",
    description: "Uses your actual listening behavior to find songs that match your taste precisely."
  },
  {
    icon: CalendarDaysIcon,
    title: "Daily Discovery",
    description: "Fresh recommendations daily that evolve with your changing music preferences."
  },
  {
    icon: BoltIcon,
    title: "Instant Setup",
    description: "One-click login with your Spotify account. No complicated setup required."
  }
];

export function FeaturesSection() {
  return (
    <div className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <Card 
              key={feature.title}
              className="bg-default-100/50 backdrop-blur-sm border-1 border-white/20"
              isHoverable
            >
              <CardBody className="space-y-4">
                <feature.icon className="h-8 w-8 text-primary" />
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 