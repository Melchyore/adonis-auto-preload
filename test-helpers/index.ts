import type { ApplicationContract } from '@ioc:Adonis/Core/Application'

import { Application } from '@adonisjs/application'

import { fs, createAppConfig, createDatabaseConfig } from '../bin/test/config'

export async function setupApp(): Promise<ApplicationContract> {
  await fs.add('.env', '')
  await fs.add('./tmp/database.sqlite', '')
  await createAppConfig()
  await createDatabaseConfig()

  const app = new Application(fs.basePath, 'test', {
    providers: ['@adonisjs/core', '@adonisjs/lucid', '../../../providers/AutoPreloadProvider'],
  })

  await app.setup()
  await app.registerProviders()
  await app.bootProviders()

  return app
}
