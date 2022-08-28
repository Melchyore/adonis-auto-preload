import type { DatabaseContract } from '@ioc:Adonis/Lucid/Database'
import type { BaseModel as BaseModelContract, ColumnDecorator } from '@ioc:Adonis/Lucid/Orm'
import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import type { AutoPreloadMixin } from '@ioc:Adonis/Addons/AutoPreload'

import { test } from '@japa/runner'
import { compose } from '@poppinss/utils/build/helpers'

import { setupDatabase, cleanDatabase } from '../bin/test/database'
import { fs } from '../bin/test/config'
import { setupApp } from '../test-helpers'

let db: DatabaseContract
let BaseModel: typeof BaseModelContract
let AutoPreload: AutoPreloadMixin
let app: ApplicationContract
let column: ColumnDecorator

test.group('Auto preload', (group) => {
  group.setup(async () => {
    app = await setupApp()
    db = app.container.resolveBinding('Adonis/Lucid/Database')
    BaseModel = app.container.resolveBinding('Adonis/Lucid/Orm').BaseModel
    AutoPreload = app.container.resolveBinding('Adonis/Addons/AutoPreload').AutoPreload
    column = app.container.resolveBinding('Adonis/Lucid/Orm').column
  })

  group.each.setup(async () => {
    await setupDatabase(db)
  })

  group.each.teardown(async () => {
    await cleanDatabase(db)
  })

  group.teardown(async () => {
    await db.manager.closeAll()
    await fs.cleanup()
  })

  test('model extending from AutoPreload mixin should have an empty $with array', async ({
    expect,
  }) => {
    class User extends compose(BaseModel, AutoPreload) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string
    }

    expect(User).toHaveProperty('$with')
    expect(User.$with).toHaveLength(0)
  })

  test('should return $with relationships', async ({ expect }) => {
    class User extends compose(BaseModel, AutoPreload) {
      public static $with = ['posts']

      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string
    }

    expect(User).toHaveProperty('$with')
    expect(User.$with[0]).toStrictEqual('posts')
  })

  test('filling $with with type other than string or function should throw an exception', async ({
    expect,
  }) => {
    expect(() => {
      class User extends compose(BaseModel, AutoPreload) {
        public static $with = [1]

        @column({ isPrimary: true })
        public id: number

        @column()
        public email: string

        @column()
        public name: string
      }

      User.boot()
    }).toThrowError(
      'The model "User" has wrong relationships to be auto-preloaded. Only string and function types are allowed'
    )
  })
})
