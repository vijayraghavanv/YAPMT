import { Settings } from "lucide-react"
import {Button} from "@/components/ui/button";
import {ModeToggle} from "@/components/mode-toggle";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between max-w-screen-2xl mx-auto">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl pl-4 md:pl-8">
              YAPMT
            </span>
          </Link>
        </div>
        <nav className="flex items-center gap-2 pr-4 md:pr-8 md:gap-4">
          <ModeToggle />
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <Settings className="h-6 w-6 md:h-7 md:w-7" />
            <span className="sr-only">Settings</span>
          </Button>
        </nav>
      </div>
    </header>
  )
}
