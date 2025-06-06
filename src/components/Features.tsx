
import { Card, CardContent } from '@/components/ui/card';
import { Search, MessageSquare, CreditCard } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: Search,
      title: "Creator Discovery Engine",
      description: "AI-powered matching finds the perfect influencers for your brand based on audience demographics, engagement rates, and content quality.",
      benefits: ["50M+ creator database", "Advanced filtering", "Audience analysis"]
    },
    {
      icon: MessageSquare,
      title: "AI Negotiation Chatbot",
      description: "Automated negotiations handle rate discussions, contract terms, and deliverable specifications while maintaining your brand voice.",
      benefits: ["24/7 negotiations", "Fair rate analysis", "Contract automation"]
    },
    {
      icon: CreditCard,
      title: "Smart Invoicing & Payouts",
      description: "Streamlined payment processing with milestone-based releases, automatic tax handling, and global payment support.",
      benefits: ["Instant payouts", "Tax compliance", "Global coverage"]
    }
  ];

  return (
    <section className="section-padding bg-gradient-to-b from-gray-50 to-white relative">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,98,67,0.05),transparent_50%)]"></div>

      <div className="container-custom relative">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-space font-bold mb-8 text-gray-900">
            Everything you need to <span className="text-coral">scale</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From discovery to payment, our platform handles every aspect of influencer marketing
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="bg-white border-gray-200 hover:border-coral/50 transition-all duration-300 hover:scale-105 hover:shadow-xl group"
            >
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-coral/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-coral/30 transition-colors">
                  <feature.icon className="h-8 w-8 text-coral" />
                </div>

                <h3 className="text-2xl font-space font-bold mb-4 text-gray-900">
                  {feature.title}
                </h3>

                <p className="text-gray-600 mb-6 leading-relaxed">
                  {feature.description}
                </p>

                <ul className="space-y-2">
                  {feature.benefits.map((benefit, idx) => (
                    <li key={idx} className="text-sm text-coral flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-coral rounded-full"></div>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
