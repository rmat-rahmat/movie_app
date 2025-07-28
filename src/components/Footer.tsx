
export default function Footer() {
  return (
    <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
       <div className="flex items-center justify-center">
        <p className="text-sm text-white">
          &copy; {new Date().getFullYear()} Seefu TV. All rights reserved.
        </p>
      </div>
      </footer>
  );
}
