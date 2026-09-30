import { lazy, Suspense, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { StoreProvider, useStore } from './lib/store.jsx'
import { AppShell, PublicShell, ContentSkeleton } from './components/layout/AppShell.jsx'
import { titleFor } from './components/layout/nav.js'
import { EffectsHost, ToastHost } from './components/fx/Rewards.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import { AnnouncerProvider } from './lib/announce.jsx'

/**
 * Route-level code splitting. Every page shipped in the main bundle before,
 * which put ~770 KB of JS on the landing page for no reason. The landing page
 * only needs the store and a fraction of the content.
 */
const Landing = lazy(() => import('./pages/Landing.jsx'))
const Auth = lazy(() => import('./pages/Auth.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Journey = lazy(() => import('./pages/Journey.jsx'))
const Learn = lazy(() => import('./pages/Learn.jsx'))
const Lesson = lazy(() => import('./pages/Lesson.jsx'))
const Daily = lazy(() => import('./pages/Daily.jsx'))
const Speed = lazy(() => import('./pages/Speed.jsx'))
const Leaderboard = lazy(() => import('./pages/Leaderboard.jsx'))
const Achievements = lazy(() => import('./pages/Achievements.jsx'))
const Assistant = lazy(() => import('./pages/Assistant.jsx'))
const SearchPage = lazy(() => import('./pages/Search.jsx'))
const Emergency = lazy(() => import('./pages/Emergency.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))
const About = lazy(() => import('./pages/About.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))

/** Gate for routes that need a profile. Keeps the demo frictionless. */
function RequireAuth({ children }) {
  const { profile, ready } = useStore()
  const loc = useLocation()
  if (!ready) return <ContentSkeleton />
  if (!profile) return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search + loc.hash }} />
  return children
}

function Public({ children }) {
  return <PublicShell>{children}</PublicShell>
}

/**
 * Per navigation: document title, then either scroll to the #hash target or to the
 * top, and move focus to <main> so keyboard/screen-reader users start at the new
 * page instead of on the link they just used. The first render is left alone.
 */
function RouteEffects() {
  const { pathname, hash } = useLocation()
  const first = useRef(true)
  useEffect(() => {
    document.title = titleFor(pathname)
    const fromLoad = first.current
    first.current = false
    if (!fromLoad) {
      const main = document.querySelector('main')
      if (main) {
        main.setAttribute('tabindex', '-1')
        main.focus({ preventScroll: true })
      }
    }
    const id = decodeURIComponent(hash.slice(1))
    if (!id) {
      window.scrollTo({ top: 0, behavior: 'instant' })
      return undefined
    }
    // the target may live in a lazy chunk that has not rendered yet — retry briefly
    let tries = 0
    let t
    const seek = () => {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ block: 'start' })
      else if ((tries += 1) < 30) t = setTimeout(seek, 50)
    }
    seek()
    return () => clearTimeout(t)
  }, [pathname, hash])
  return null
}

export default function App() {
  return (
    <ErrorBoundary>
      {/* Respect the OS "reduce motion" setting for the whole tree, not per component. */}
      <MotionConfig reducedMotion="user">
        {/* Screen-reader announcements for every invisible state change. */}
        <AnnouncerProvider>
          <StoreProvider>
          <BrowserRouter>
            <RouteEffects />
            <Suspense fallback={<ContentSkeleton />}>
              <Routes>
                {/* public marketing + auth */}
                <Route path="/" element={<Public><Landing /></Public>} />
                <Route path="/login" element={<Public><Auth /></Public>} />

                {/* app shell — every page here is one click from the demo flow */}
                <Route element={<AppShell />}>
                  <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
                  <Route path="/journey" element={<RequireAuth><Journey /></RequireAuth>} />
                  <Route path="/learn" element={<RequireAuth><Learn /></RequireAuth>} />
                  <Route path="/lesson/:moduleId" element={<RequireAuth><Lesson /></RequireAuth>} />
                  <Route path="/daily" element={<RequireAuth><Daily /></RequireAuth>} />
                  <Route path="/speed" element={<RequireAuth><Speed /></RequireAuth>} />
                  <Route path="/leaderboard" element={<RequireAuth><Leaderboard /></RequireAuth>} />
                  <Route path="/achievements" element={<RequireAuth><Achievements /></RequireAuth>} />
                  <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                  <Route path="/search" element={<RequireAuth><SearchPage /></RequireAuth>} />
                  <Route path="/ai" element={<Assistant />} />
                  <Route path="/emergency" element={<Emergency />} />
                  <Route path="/about" element={<About />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>
            <EffectsHost />
            <ToastHost />
          </BrowserRouter>
          </StoreProvider>
        </AnnouncerProvider>
      </MotionConfig>
    </ErrorBoundary>
  )
}
