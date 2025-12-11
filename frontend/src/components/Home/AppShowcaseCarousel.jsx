import React from "react";

function AppShowcaseCarousel() {
  const slides = [
    {
      title: "AI Career Coach",
      desc: "Personalized growth: resume insights, career journaling, and goal tracking with weekly check‑ins.",
      icon: "🤖",
    },
    {
      title: "Smart Job Matching",
      desc: "Tailored roles by skills, location, and goals. Skip the noise; find what fits.",
      icon: "🎯",
    },
    {
      title: "Knowledge Base",
      desc: "Curated learning paths and market insights to upskill faster.",
      icon: "📚",
    },
    {
      title: "Career Journal",
      desc: "Capture wins and challenges. AI surfaces patterns and next best steps.",
      icon: "📝",
    },
    {
      title: "Goal Setting",
      desc: "Define timelines and focus areas (salary, skills, position, industry) with clear priorities.",
      icon: "🎯",
    },
    {
      title: "Terms & Consent",
      desc: "Transparent data usage and proactive guidance consent—privacy-first design.",
      icon: "🔐",
    },
  ];

  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % slides.length), 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="flex w-full" style={{ transform: `translateX(-${idx * 100}%)`, transition: "transform 500ms ease" }}>
        {slides.map((s, i) => (
          <div key={i} className="min-w-full p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="text-4xl select-none">{s.icon}</div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{s.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{s.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
        {slides.map((_, i) => (
          <span key={i} className={`w-2 h-2 rounded-full ${i === idx ? 'bg-emerald-500' : 'bg-gray-400/60'}`}></span>
        ))}
      </div>
    </div>
  );
}

export default AppShowcaseCarousel;


