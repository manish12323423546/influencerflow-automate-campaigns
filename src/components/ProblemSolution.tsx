
import { CheckCircle, X } from 'lucide-react';

const ProblemSolution = () => {
  const problems = [
    "Managing campaigns in endless spreadsheets",
    "Chasing influencers through email chains",
    "Manual contract negotiations",
    "Scattered payment processes",
    "No real-time ROI tracking"
  ];

  const solutions = [
    "AI-powered influencer discovery",
    "Automated outreach & follow-ups",
    "Smart contract generation",
    "Integrated payment system",
    "Live campaign analytics"
  ];

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Problem Side */}
          <div className="space-y-8">
            <h2 className="text-4xl md:text-5xl font-space font-bold text-gray-900 mb-8">
              The <span className="text-red-500">old way</span>
            </h2>

            <div className="space-y-6">
              {problems.map((problem, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 animate-slide-in-right"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <X className="h-6 w-6 text-red-500 mt-1 flex-shrink-0" />
                  <p className="text-lg text-gray-700">{problem}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Solution Side */}
          <div className="space-y-8">
            <h2 className="text-4xl md:text-5xl font-space font-bold text-gray-900 mb-8">
              The <span className="text-coral">InfluencerFlow way</span>
            </h2>

            <div className="space-y-6">
              {solutions.map((solution, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 animate-slide-in-right"
                  style={{ animationDelay: `${(index * 100) + 300}ms` }}
                >
                  <CheckCircle className="h-6 w-6 text-coral mt-1 flex-shrink-0" />
                  <p className="text-lg text-gray-700">{solution}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolution;
