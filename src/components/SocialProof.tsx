
import { useState, useEffect } from 'react';

const SocialProof = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const brands = [
    { name: "TechCorp", logo: "TC" },
    { name: "Fashion Forward", logo: "FF" },
    { name: "Wellness Co", logo: "WC" },
    { name: "Gaming Hub", logo: "GH" },
    { name: "Beauty Brand", logo: "BB" },
    { name: "Travel Tales", logo: "TT" }
  ];

  const testimonials = [
    {
      quote: "InfluencerFlow cut our campaign setup time by 75%. The AI negotiations are game-changing.",
      author: "Sarah Chen",
      title: "Marketing Director at TechCorp",
      company: "TechCorp"
    },
    {
      quote: "Finally, a platform that understands the complexity of influencer marketing at scale.",
      author: "Marcus Johnson",
      title: "Brand Manager at Fashion Forward",
      company: "Fashion Forward"
    },
    {
      quote: "The ROI tracking is incredible. We can see which influencers actually drive sales.",
      author: "Emma Rodriguez",
      title: "Growth Lead at Wellness Co",
      company: "Wellness Co"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-custom">
        {/* Brand Logos */}
        <div className="text-center mb-16">
          <p className="text-gray-600 mb-8 text-lg">Trusted by innovative brands</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-8 items-center justify-items-center">
            {brands.map((brand, index) => (
              <div
                key={index}
                className="w-16 h-16 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-400 hover:text-coral hover:border-coral/50 hover:shadow-md transition-all duration-300 font-space font-bold"
              >
                {brand.logo}
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial Carousel */}
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-lg p-12">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
            >
              {testimonials.map((testimonial, index) => (
                <div key={index} className="w-full flex-shrink-0 text-center">
                  <blockquote className="text-2xl md:text-3xl font-space leading-relaxed text-gray-900 mb-8">
                    "{testimonial.quote}"
                  </blockquote>
                  <div>
                    <p className="text-coral font-semibold text-lg">{testimonial.author}</p>
                    <p className="text-gray-600">{testimonial.title}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Dots indicator */}
            <div className="flex justify-center mt-8 gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentTestimonial ? 'bg-coral' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
