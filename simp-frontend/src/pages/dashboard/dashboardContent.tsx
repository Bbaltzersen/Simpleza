import React from 'react'

import Overview from './overview/overview'
import Recipes from './recipes/recipes'

function DashboardContent() {
  return (
    <div>
      <Overview/>
      <Recipes/>
    </div>
  )
}

export default DashboardContent