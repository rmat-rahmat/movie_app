
export default function Footer() {
  return (
    <footer className="row-start-3 mt-[-30px] flex gap-[24px] flex-wrap items-center justify-center relative transparent">
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none h-full">
      <svg viewBox="0 0 1440 100" className="w-full h-full " preserveAspectRatio="none">
        <path
          d="M0,0 C360,80 1080,-40 1440,40 L1440,100 L0,100 Z"
          fill="#e50914" // Tailwind's bg-[#e50914] is #22c55e, 0.5 opacity
        />
      </svg>
        
      </div>
      <div className="flex items-center justify-center w-full pt-12 pb-6 z-10">
        <p className="text-sm text-white">
          &copy; {new Date().getFullYear()} Seefu TV. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
