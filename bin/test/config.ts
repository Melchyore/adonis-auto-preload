import { Filesystem } from '@poppinss/dev-utils'
import { resolve, join } from 'path'

export const fs = new Filesystem(join(__dirname, 'app'))

const databaseConfig = {
  connection: 'sqlite',
  connections: {
    sqlite: {
      client: 'sqlite',
      connection: {
        filename: resolve(__dirname, './app/tmp/database.sqlite'),
      },
    },
  },
}

export async function createAppConfig() {
  await fs.add(
    'config/app.ts',
    `
		export const appKey = 'averylong32charsrandomsecretkey',
		export const http = {
			cookie: {},
			trustProxy: () => true,
		}
	`
  )
}

export async function createDatabaseConfig() {
  await fs.add(
    'config/database.ts',
    `
		const databaseConfig = ${JSON.stringify(databaseConfig, null, 2)}
		export default databaseConfig
	`
  )
}
