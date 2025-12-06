import { Navigation } from "@/components/ui/Navigation"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div>
      <Navigation />
      <div className="mx-auto max-w-7xl px-4 pb-32 pt-4 sm:px-6 sm:pt-6">
        {children}
      </div>
    </div>
  )
}
