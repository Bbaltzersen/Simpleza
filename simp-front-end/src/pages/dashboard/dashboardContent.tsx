import React from 'react'

import Overview from './overview/overview'
import Recipes from './recipes/recipes'

import { DashboardProvider } from '@/lib/context/dashboardContext'

function DashboardContent() {
  return (
    <DashboardProvider>
      <Overview/>
      <Recipes/>
    </DashboardProvider>
  )
}

export default DashboardContent