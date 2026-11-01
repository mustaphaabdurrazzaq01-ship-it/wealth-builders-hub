import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { RequireAuth, RequireRole } from './components/Shell'
import { Loading } from './components/ui'
import Login from './pages/Login'

const Overview = lazy(() => import('./pages/Overview'))
const Articles = lazy(() => import('./pages/Articles'))
const ArticleEditor = lazy(() => import('./pages/ArticleEditor'))
const Resources = lazy(() => import('./pages/Resources'))
const ResourceEditor = lazy(() => import('./pages/ResourceEditor'))
const Products = lazy(() => import('./pages/Products'))
const ProductEditor = lazy(() => import('./pages/ProductEditor'))
const Applications = lazy(() => import('./pages/Applications'))
const Messages = lazy(() => import('./pages/Messages'))
const Users = lazy(() => import('./pages/Users'))
const Seo = lazy(() => import('./pages/Seo'))
const Settings = lazy(() => import('./pages/Settings'))
const Activity = lazy(() => import('./pages/Activity'))
const Status = lazy(() => import('./pages/Status'))

const admin = (el: JSX.Element) => <RequireRole roles={['admin']}>{el}</RequireRole>

export default function App() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}><Loading /></div>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth />}>
          <Route index element={<Overview />} />
          <Route path="articles" element={<Articles />} />
          <Route path="articles/:id" element={<ArticleEditor />} />
          <Route path="resources" element={<Resources />} />
          <Route path="resources/:id" element={<ResourceEditor />} />
          <Route path="products" element={admin(<Products />)} />
          <Route path="products/:id" element={admin(<ProductEditor />)} />
          <Route path="applications" element={admin(<Applications />)} />
          <Route path="messages" element={admin(<Messages />)} />
          <Route path="users" element={admin(<Users />)} />
          <Route path="seo" element={admin(<Seo />)} />
          <Route path="settings" element={admin(<Settings />)} />
          <Route path="activity" element={admin(<Activity />)} />
          <Route path="status" element={<Status />} />
          <Route path="*" element={<div className="alert alert--info">That page does not exist.</div>} />
        </Route>
      </Routes>
    </Suspense>
  )
}
