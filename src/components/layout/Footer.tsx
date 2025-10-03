
export default function Footer() {
  return (
    <footer className="row-start-3 mt-[-30px] flex gap-[24px] flex-wrap items-center justify-center relative transparent bg-[#fbb033] md:bg-transparent">
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none h-full">
      <svg viewBox="0 0 1440 100" className="w-full h-full hidden md:block" preserveAspectRatio="none">
        <path
          d="M0,0 C360,80 1080,-40 1440,40 L1440,100 L0,100 Z"
          fill="#fbb033" // Tailwind's bg-[#fbb033] is #22c55e, 0.5 opacity
        />
      </svg>
      </div>
      <div className="flex items-center justify-center w-full pt-5 md:pt-12 pb-6 z-10">
        <div className="max-w-3xl text-center px-4">
          <p className="text-sm text-white font-semibold">
            &copy; {new Date().getFullYear()} OTalk TV. All rights reserved.
          </p>
          <p className="mt-2 text-xs text-gray-100 leading-relaxed">
            All content on this website — including text, images, audio, video, and code — is
            protected by copyright and other intellectual property laws. Unauthorized linking,
            copying, reproduction, distribution, adaptation or public performance of any
            content is strictly prohibited without prior written permission. The legal effect of
            this notice depends on applicable jurisdiction and specific facts; nothing herein
            waives any rights. For licensing or permission requests please contact the site
            administrator via the contact page.
          </p>
        </div>
      </div>
    </footer>
  );
}
