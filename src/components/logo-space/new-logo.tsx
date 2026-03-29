const TimecraftLogo1 = () => (
  <svg viewBox="0 0 280 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-16">
    {/* Gradient clock icon - Jira/Monday style */}
    <defs>
      <linearGradient id="grad1a" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6C5CE7" />
        <stop offset="1" stopColor="#00B4D8" />
      </linearGradient>
      <linearGradient id="grad1b" x1="16" y1="16" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF6B6B" />
        <stop offset="1" stopColor="#FFA502" />
      </linearGradient>
    </defs>
    {/* Rounded square background */}
    <rect x="4" y="4" width="56" height="56" rx="14" fill="url(#grad1a)" />
    {/* Clock face */}
    <circle cx="32" cy="32" r="18" fill="none" stroke="white" strokeWidth="2.5" />
    {/* Hour hand */}
    <line x1="32" y1="32" x2="32" y2="20" stroke="white" strokeWidth="3" strokeLinecap="round" />
    {/* Minute hand */}
    <line x1="32" y1="32" x2="42" y2="28" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    {/* Center dot */}
    <circle cx="32" cy="32" r="2.5" fill="white" />
    {/* Craft spark */}
    <path d="M46 14L49 8L52 14L49 12Z" fill="url(#grad1b)" />
    <path d="M50 18L54 16L52 20Z" fill="url(#grad1b)" opacity="0.7" />
    {/* Text */}
    <text x="72" y="28" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="26" fill="#2D3436">Time</text>
    <text x="136" y="28" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="26" fill="#6C5CE7">craft</text>
    <text x="72" y="48" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="400" fontSize="11" fill="#636E72" letterSpacing="3">PRODUCTIVITY</text>
  </svg>
);

const TimecraftLogo2 = () => (
  <svg viewBox="0 0 300 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-16">
    <defs>
      <linearGradient id="grad2a" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0052CC" />
        <stop offset="1" stopColor="#00C2FF" />
      </linearGradient>
      <linearGradient id="grad2b" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00C2FF" />
        <stop offset="1" stopColor="#7B68EE" />
      </linearGradient>
    </defs>
    {/* Stacked layers - Trello/AWS style */}
    <path d="M8 18C8 11.373 13.373 6 20 6H44C50.627 6 56 11.373 56 18V30L32 42L8 30V18Z" fill="url(#grad2a)" />
    <path d="M8 30L32 42L56 30V42C56 48.627 50.627 54 44 54H20C13.373 54 8 48.627 8 42V30Z" fill="url(#grad2b)" opacity="0.85" />
    {/* Clock hands in the icon */}
    <line x1="32" y1="18" x2="32" y2="30" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="32" y1="30" x2="40" y2="24" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <circle cx="32" cy="30" r="2" fill="white" />
    {/* Text */}
    <text x="68" y="38" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="700" fontSize="28" fill="#1A1A2E">Timecraft</text>
    <rect x="68" y="44" width="40" height="3" rx="1.5" fill="#0052CC" />
    <rect x="112" y="44" width="20" height="3" rx="1.5" fill="#00C2FF" />
  </svg>
);

const TimecraftLogo3 = () => (
  <svg viewBox="0 0 300 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-16">
    <defs>
      <linearGradient id="grad3a" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF4757" />
        <stop offset="0.5" stopColor="#FF6348" />
        <stop offset="1" stopColor="#FFA502" />
      </linearGradient>
      <linearGradient id="grad3b" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFA502" />
        <stop offset="1" stopColor="#FFEAA7" />
      </linearGradient>
    </defs>
    {/* Hexagon-ish shape - modern SaaS style */}
    <path d="M32 4L56 16V44L32 56L8 44V16L32 4Z" fill="url(#grad3a)" />
    {/* Inner hourglass */}
    <path d="M22 18H42L32 32L42 46H22L32 32L22 18Z" fill="white" fillOpacity="0.9" />
    {/* Sand particles */}
    <circle cx="32" cy="35" r="1.5" fill="white" fillOpacity="0.6" />
    <circle cx="30" cy="38" r="1" fill="white" fillOpacity="0.4" />
    <circle cx="34" cy="37" r="1" fill="white" fillOpacity="0.5" />
    {/* Text */}
    <text x="68" y="30" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="28" fill="#2D3436">Time</text>
    <text x="138" y="30" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="28" fill="#FF4757">craft</text>
    <text x="68" y="48" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="500" fontSize="10" fill="#636E72" letterSpacing="4.5">TIME MANAGEMENT</text>
  </svg>
);

const TimecraftLogo4 = () => (
  <svg viewBox="0 0 300 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-16">
    <defs>
      <linearGradient id="grad4" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
        <stop stopColor="#A29BFE" />
        <stop offset="0.5" stopColor="#6C5CE7" />
        <stop offset="1" stopColor="#0984E3" />
      </linearGradient>
      <filter id="shadow4">
        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#6C5CE7" floodOpacity="0.3" />
      </filter>
    </defs>
    {/* Circle with cut - like Monday.com dots */}
    <circle cx="32" cy="32" r="26" fill="url(#grad4)" filter="url(#shadow4)" />
    {/* T lettermark */}
    <rect x="22" y="16" width="20" height="4" rx="2" fill="white" />
    <rect x="30" y="16" width="4" height="24" rx="2" fill="white" />
    {/* Clock accent */}
    <path d="M42 38A14 14 0 0 0 46 28" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    <circle cx="46" cy="28" r="2" fill="white" opacity="0.8" />
    {/* Text */}
    <text x="68" y="36" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="700" fontSize="30" letterSpacing="-0.5" fill="#2D3436">timecraft</text>
  </svg>
);

const Index = () => {
  const logos = [
    { id: 1, component: <TimecraftLogo1 />, label: "แบบที่ 1: Gradient Clock", desc: "ไอคอนนาฬิกาบน Rounded Square สีม่วง-ฟ้า สไตล์ Jira" },
    { id: 2, component: <TimecraftLogo2 />, label: "แบบที่ 2: Layered Shape", desc: "รูปทรง 3 มิติซ้อนกัน สไตล์ AWS / Trello" },
    { id: 3, component: <TimecraftLogo3 />, label: "แบบที่ 3: Hexagon Hourglass", desc: "หกเหลี่ยมสีส้ม-แดง พร้อมนาฬิกาทราย สไตล์ Modern SaaS" },
    { id: 4, component: <TimecraftLogo4 />, label: "แบบที่ 4: Circle T-mark", desc: "วงกลมไล่สีม่วง-น้ำเงิน ตัว T สไตล์ Monday.com" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center py-16 px-4">
      <h1 className="text-4xl font-bold tracking-tight mb-2">Timecraft Logo Options</h1>
      <p className="text-muted-foreground mb-16 text-lg">เลือกโลโก้ที่ถูกใจแล้วบอกได้เลย!</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl w-full">
        {logos.map((logo) => (
          <div
            key={logo.id}
            className="rounded-2xl border bg-card p-8 flex flex-col items-center gap-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          >
            <div className="w-full flex items-center justify-center py-6 bg-muted/20 rounded-xl">
              {logo.component}
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold mb-1">{logo.label}</h2>
              <p className="text-sm text-muted-foreground">{logo.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Index;