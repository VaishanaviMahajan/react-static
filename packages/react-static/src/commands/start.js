import fs from 'fs-extra'
//
import prepareRoutes from '../static/prepareRoutes'
import prepareBrowserPlugins from '../static/prepareBrowserPlugins'
import { startDevServer, reloadRoutes } from '../static/webpack'
import getConfig from '../static/getConfig'
import extractTemplates from '../static/extractTemplates'
import generateTemplates from '../static/generateTemplates'
import createIndexPlaceholder from '../utils/createIndexPlaceholder'
//

let cleaned
let indexCreated

export default (async function start({ config: configPath, debug } = {}) {
  // ensure ENV variables are set
  if (typeof process.env.NODE_ENV === 'undefined') {
    process.env.NODE_ENV = 'development'
  }
  if (debug) {
    process.env.REACT_STATIC_DEBUG = 'true'
  }
  process.env.REACT_STATIC_ENV = 'development'
  process.env.BABEL_ENV = 'development'

  // Use callback style to subscribe to changes
  await getConfig(configPath, async config => {
    if (debug) {
      console.log('DEBUG - Resolved static.config.js:')
      console.log(config)
    }

    if (!cleaned) {
      cleaned = true
      // Clean the dist folder
      await fs.remove(config.paths.DIST)
    }

    // Get the site data
    config.siteData = await config.getSiteData({ dev: true })

    // Render an index.html placeholder
    if (!indexCreated) {
      indexCreated = true
      await createIndexPlaceholder({
        config,
      })
    }

    config = await prepareBrowserPlugins(config)

    await prepareRoutes(config, { dev: true }, async config => {
      await extractTemplates(config, { dev: true })
      await generateTemplates(config)
      reloadRoutes()

      // Build the JS bundle
      await startDevServer({ config })
    })
  })

  await new Promise(() => {
    // Do nothing, the user must exit this command
  })
})
