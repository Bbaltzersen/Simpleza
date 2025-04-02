import React from 'react'

import Overview from './overview/overview'
import Recipes from './recipes/recipes'

import { DashboardProvider } from '@/lib/context/dashboardContext'
import Cauldron from './cauldron/cauldron'

function DashboardContent() {
  return (
    <DashboardProvider>
      <Overview/>
      <Cauldron />
      <Recipes/>
    </DashboardProvider>
    
  )
}

export default DashboardContent