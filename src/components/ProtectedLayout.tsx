import Navbar from "@/components/Navbar";
import Footer from "./Footer";


export default function ProtectedLayout({children}: {children: React.ReactNode}) {
  return (
    <div className="font-sans grid   min-h-screen pb-20 ">
      <Navbar />
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start pt-[35px]">
        {children}
      </main>
      <Footer/>
    </div>
  );
}

