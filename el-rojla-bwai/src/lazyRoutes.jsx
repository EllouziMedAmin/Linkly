import { lazy } from 'react'

const Discover = lazy(() => import('./pages/Discover'))
const ProgrammeDetail = lazy(() => import('./pages/Programme'))
const Apply = lazy(() => import('./pages/Apply'))
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'))

export { Discover, ProgrammeDetail, Apply, Dashboard }
