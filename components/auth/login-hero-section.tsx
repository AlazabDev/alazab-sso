'use client'

export function LoginHeroSection() {
  const benefits = [
    {
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            d="M12 15a3 3 0 100-6 3 3 0 000 6z"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M19.4 15a1.65 1.65 0 00.33-1.82l-2.5-4.3a2 2 0 00-2.65-.75l-.59.35a2 2 0 01-2.38-.3 2 2 0 01-.3-2.38l.35-.59a2 2 0 00-.75-2.65l-4.3-2.5a1.65 1.65 0 00-1.82.33l-.2.25a2 2 0 01-3 .11 2 2 0 01.1-3l.25-.2a1.65 1.65 0 00.33-1.82l-2.5-4.3a2 2 0 00-2.65-.75L2.1 2m12 3l2.45-2.45"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      title: 'دخول موحد وآمن',
    },
    {
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
          <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" />
          <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" />
          <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" />
        </svg>
      ),
      title: 'متابعة الخدمات والطلبات',
    },
    {
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            d="M9 11l3 3L22 4"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      title: 'تجربة بسيطة لجميع المستخدمين',
    },
  ]

  return (
    <div className="hidden lg:flex lg:w-1/2 bg-primary text-primary-foreground p-12 flex-col justify-between rounded-r-2xl">
      {/* Logo/Branding */}
      <div>
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-accent text-primary rounded-lg font-bold text-lg">
            ع
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        <h1 className="text-4xl font-bold leading-tight text-pretty">
          منظومة واحدة لإدارة أعمالك وخدماتك بكفاءة
        </h1>

        {/* Benefits List */}
        <div className="space-y-4">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center text-accent mt-0.5">
                {benefit.icon}
              </div>
              <div>
                <p className="font-medium text-lg">{benefit.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-sm opacity-75 pt-8 border-t border-primary-foreground/20">
        <p>© 2024 منظومة العزب. جميع الحقوق محفوظة.</p>
      </div>
    </div>
  )
}
