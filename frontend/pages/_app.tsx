/**
 * Next.js App Component
 * 
 * This is the root component that wraps all pages.
 * It imports global styles and sets up the app structure.
 */

import type { AppProps } from 'next/app'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}

