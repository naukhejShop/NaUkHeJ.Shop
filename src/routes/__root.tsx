import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { NotFoundPage } from '@/components/error-pages'
import { ShopProvider } from '@/lib/shop-store'
import { SiteHeader, SiteFooter } from '@/components/site-shell'

import '../styles.css'

const siteName = 'Naukhejshop.com — Instant Panel Keys'
const siteDescription =
  'Buy panel keys instantly on Naukhejshop.com. Choose 1 hour, 3 hours, 6 hours or longer, pay from your wallet and get your key in seconds.'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: siteName,
      },
      {
        name: 'description',
        content: siteDescription,
      },
      {
        property: 'og:title',
        content: siteName,
      },
      {
        property: 'og:description',
        content: siteDescription,
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap',
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFoundPage,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        <TooltipProvider>
          <ShopProvider>
            <SiteHeader />
            <main className="min-h-[calc(100vh-4rem)]">{children}</main>
            <SiteFooter />
          </ShopProvider>
        </TooltipProvider>
        <Toaster theme="dark" position="top-center" />
        <Scripts />
      </body>
    </html>
  )
}
