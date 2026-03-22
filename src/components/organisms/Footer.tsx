import Link from "next/link"

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-900 bg-zinc-950 py-12 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col items-center md:items-start gap-2">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-6 h-6 bg-orange-600 rounded flex items-center justify-center">
              <span className="font-black text-white text-xs italic">W</span>
            </div>
            <span className="font-black text-lg tracking-tighter italic">
              dwizzyWEEB
            </span>
          </Link>
          <p className="text-xs text-zinc-500 max-w-xs text-center md:text-left">
            Your premium destination for high-quality Anime, Manga, and Donghua content.
          </p>
        </div>

        <div className="flex gap-12">
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Navigation</h4>
            <ul className="space-y-2 text-xs font-bold text-zinc-500">
              <li><Link href="/anime" className="hover:text-blue-400 transition-colors">Anime</Link></li>
              <li><Link href="/manga" className="hover:text-orange-400 transition-colors">Manga</Link></li>
              <li><Link href="/donghua" className="hover:text-red-400 transition-colors">Donghua</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Legal</h4>
            <ul className="space-y-2 text-xs font-bold text-zinc-500">
              <li><Link href="#" className="hover:text-zinc-200 transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-zinc-200 transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-zinc-200 transition-colors">DMCA</Link></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-zinc-900 text-center">
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
          &copy; {new Date().getFullYear()} dwizzyWEEB. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
