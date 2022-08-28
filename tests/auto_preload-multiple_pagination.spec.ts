import type { DatabaseContract } from '@ioc:Adonis/Lucid/Database'
import type {
  BaseModel as BaseModelContract,
  ColumnDecorator,
  BelongsTo,
  BelongsToDecorator,
  HasMany,
  HasManyDecorator,
  ModelQueryBuilderContract,
} from '@ioc:Adonis/Lucid/Orm'
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
let belongsTo: BelongsToDecorator
let hasMany: HasManyDecorator

test.group('Auto preload - Pagination', (group) => {
  group.setup(async () => {
    app = await setupApp()
    db = app.container.resolveBinding('Adonis/Lucid/Database')
    BaseModel = app.container.resolveBinding('Adonis/Lucid/Orm').BaseModel
    AutoPreload = app.container.resolveBinding('Adonis/Addons/AutoPreload').AutoPreload
    column = app.container.resolveBinding('Adonis/Lucid/Orm').column
    belongsTo = app.container.resolveBinding('Adonis/Lucid/Orm').belongsTo
    hasMany = app.container.resolveBinding('Adonis/Lucid/Orm').hasMany
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

  test('using mixin should auto-preload relationships when using relation name', async ({
    expect,
  }) => {
    class Post extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public userId: number

      @column()
      public title: string

      @column()
      public content: string
    }

    class User extends compose(BaseModel, AutoPreload) {
      public static $with = ['posts']

      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string

      @hasMany(() => Post)
      public posts: HasMany<typeof Post>
    }

    const user = await User.create({
      email: 'john@doe.com',
      name: 'John Doe',
    })

    await user.related('posts').createMany([
      {
        title: 'Test',
        content: 'Test content',
      },
      {
        title: 'Foo',
        content: 'Foo content',
      },
    ])

    expect((await User.query().paginate(1)).at(0)?.$preloaded.posts).toHaveLength(2)
  })

  test('using mixin should auto-preload relationships when using a function', async ({
    expect,
  }) => {
    class Post extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public userId: number

      @column()
      public title: string

      @column()
      public content: string
    }

    class User extends compose(BaseModel, AutoPreload) {
      public static $with = [
        (query: ModelQueryBuilderContract<typeof this>) => {
          query.preload('posts')
        },
      ]

      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string

      @hasMany(() => Post)
      public posts: HasMany<typeof Post>
    }

    const user = await User.create({
      email: 'john@doe.com',
      name: 'John Doe',
    })

    await user.related('posts').createMany([
      {
        title: 'Test',
        content: 'Test content',
      },
      {
        title: 'Foo',
        content: 'Foo content',
      },
    ])

    expect((await User.query().paginate(1)).at(0)?.$preloaded.posts).toHaveLength(2)
  })

  test('using mixin should auto-preload nested relationships when using relation name', async ({
    expect,
  }) => {
    class Comment extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public userId: number

      @column()
      public postId: number

      @column()
      public comment: string
    }

    class Post extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public userId: number

      @column()
      public title: string

      @column()
      public content: string

      @hasMany(() => Comment)
      public comments: HasMany<typeof Comment>
    }

    class User extends compose(BaseModel, AutoPreload) {
      public static $with = ['posts.comments']

      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string

      @hasMany(() => Post)
      public posts: HasMany<typeof Post>
    }

    const user = await User.create({
      email: 'john@doe.com',
      name: 'John Doe',
    })

    const post1 = new Post()
    post1.title = 'Test'
    post1.content = 'Test content'

    const post2 = new Post()
    post2.title = 'Foo'
    post2.content = 'Foo content'

    await user.related('posts').saveMany([post1, post2])

    await post1.related('comments').create({
      userId: 1,
      comment: 'Test',
    })

    await post2.related('comments').createMany([
      {
        userId: 1,
        comment: 'Bar',
      },
      {
        userId: 1,
        comment: 'Foo',
      },
    ])

    expect(
      (await User.query().paginate(1)).at(0)?.$preloaded.posts[0].$preloaded.comments
    ).toHaveLength(1)
    expect(
      (await User.query().paginate(1)).at(0)?.$preloaded.posts[1].$preloaded.comments
    ).toHaveLength(2)
  })

  test('using mixin should auto-preload nested relationships when using a function', async ({
    expect,
  }) => {
    class Comment extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public userId: number

      @column()
      public postId: number

      @column()
      public comment: string
    }

    class Post extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public userId: number

      @column()
      public title: string

      @column()
      public content: string

      @hasMany(() => Comment)
      public comments: HasMany<typeof Comment>
    }

    class User extends compose(BaseModel, AutoPreload) {
      public static $with = [
        (query: ModelQueryBuilderContract<typeof this>) => {
          query.preload('posts', (postsQuery) => {
            postsQuery.preload('comments')
          })
        },
      ]

      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string

      @hasMany(() => Post)
      public posts: HasMany<typeof Post>
    }

    const user = await User.create({
      email: 'john@doe.com',
      name: 'John Doe',
    })

    const post1 = new Post()
    post1.title = 'Test'
    post1.content = 'Test content'

    const post2 = new Post()
    post2.title = 'Foo'
    post2.content = 'Foo content'

    await user.related('posts').saveMany([post1, post2])

    await post1.related('comments').create({
      userId: 1,
      comment: 'Test',
    })

    await post2.related('comments').createMany([
      {
        userId: 1,
        comment: 'Bar',
      },
      {
        userId: 1,
        comment: 'Foo',
      },
    ])

    expect(
      (await User.query().paginate(1)).at(0)?.$preloaded.posts[0].$preloaded.comments
    ).toHaveLength(1)
    expect(
      (await User.query().paginate(1)).at(0)?.$preloaded.posts[1].$preloaded.comments
    ).toHaveLength(2)
  })

  test('using mixin should auto-preload multiple relationships when using relation names', async ({
    expect,
  }) => {
    class Comment extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public userId: number

      @column()
      public postId: number

      @column()
      public comment: string
    }

    class Post extends compose(BaseModel, AutoPreload) {
      public static $with = ['user', 'comments']

      @column({ isPrimary: true })
      public id: number

      @column()
      public userId: number

      @column()
      public title: string

      @column()
      public content: string

      @belongsTo(() => User)
      public user: BelongsTo<typeof User>

      @hasMany(() => Comment)
      public comments: HasMany<typeof Comment>
    }

    class User extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string

      @hasMany(() => Post)
      public posts: HasMany<typeof Post>
    }

    const user = await User.create({
      email: 'john@doe.com',
      name: 'John Doe',
    })

    const post1 = new Post()
    post1.title = 'Test'
    post1.content = 'Test content'

    const post2 = new Post()
    post2.title = 'Foo'
    post2.content = 'Foo content'

    await user.related('posts').saveMany([post1, post2])

    await post1.related('comments').create({
      userId: 1,
      comment: 'Test',
    })

    await post2.related('comments').createMany([
      {
        userId: 1,
        comment: 'Bar',
      },
      {
        userId: 1,
        comment: 'Foo',
      },
    ])

    const posts = await Post.query().paginate(1)

    expect(posts.at(0)?.$preloaded).toHaveProperty('user')
    expect(posts.at(0)?.$preloaded).toHaveProperty('comments')
    expect(posts.at(0)?.$preloaded.comments).toHaveLength(1)
    expect(posts.at(1)?.$preloaded).toHaveProperty('user')
    expect(posts.at(1)?.$preloaded).toHaveProperty('comments')
    expect(posts.at(1)?.$preloaded.comments).toHaveLength(2)
  })

  test('using mixin should auto-preload multiple relationships when using functions', async ({
    expect,
  }) => {
    class Comment extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public userId: number

      @column()
      public postId: number

      @column()
      public comment: string
    }

    class Post extends compose(BaseModel, AutoPreload) {
      public static $with = [
        (query: ModelQueryBuilderContract<typeof this>) => {
          query.preload('user')
        },
        (query: ModelQueryBuilderContract<typeof this>) => {
          query.preload('comments')
        },
      ]

      @column({ isPrimary: true })
      public id: number

      @column()
      public userId: number

      @column()
      public title: string

      @column()
      public content: string

      @belongsTo(() => User)
      public user: BelongsTo<typeof User>

      @hasMany(() => Comment)
      public comments: HasMany<typeof Comment>
    }

    class User extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string

      @hasMany(() => Post)
      public posts: HasMany<typeof Post>
    }

    const user = await User.create({
      email: 'john@doe.com',
      name: 'John Doe',
    })

    const post1 = new Post()
    post1.title = 'Test'
    post1.content = 'Test content'

    const post2 = new Post()
    post2.title = 'Foo'
    post2.content = 'Foo content'

    await user.related('posts').saveMany([post1, post2])

    await post1.related('comments').create({
      userId: 1,
      comment: 'Test',
    })

    await post2.related('comments').createMany([
      {
        userId: 1,
        comment: 'Bar',
      },
      {
        userId: 1,
        comment: 'Foo',
      },
    ])

    const posts = await Post.query().paginate(1)

    expect(posts.at(0)?.$preloaded).toHaveProperty('user')
    expect(posts.at(0)?.$preloaded).toHaveProperty('comments')
    expect(posts.at(0)?.$preloaded.comments).toHaveLength(1)
    expect(posts.at(1)?.$preloaded).toHaveProperty('user')
    expect(posts.at(1)?.$preloaded).toHaveProperty('comments')
    expect(posts.at(1)?.$preloaded.comments).toHaveLength(2)
  })

  test('using mixin should auto-preload multiple relationships when using relation names and functions', async ({
    expect,
  }) => {
    class Comment extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public userId: number

      @column()
      public postId: number

      @column()
      public comment: string
    }

    class Post extends compose(BaseModel, AutoPreload) {
      public static $with = [
        'user',
        (query: ModelQueryBuilderContract<typeof this>) => {
          query.preload('comments')
        },
      ]

      @column({ isPrimary: true })
      public id: number

      @column()
      public userId: number

      @column()
      public title: string

      @column()
      public content: string

      @belongsTo(() => User)
      public user: BelongsTo<typeof User>

      @hasMany(() => Comment)
      public comments: HasMany<typeof Comment>
    }

    class User extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string

      @hasMany(() => Post)
      public posts: HasMany<typeof Post>
    }

    const user = await User.create({
      email: 'john@doe.com',
      name: 'John Doe',
    })

    const post1 = new Post()
    post1.title = 'Test'
    post1.content = 'Test content'

    const post2 = new Post()
    post2.title = 'Foo'
    post2.content = 'Foo content'

    await user.related('posts').saveMany([post1, post2])

    await post1.related('comments').create({
      userId: 1,
      comment: 'Test',
    })

    await post2.related('comments').createMany([
      {
        userId: 1,
        comment: 'Bar',
      },
      {
        userId: 1,
        comment: 'Foo',
      },
    ])

    const posts = await Post.query().paginate(1)

    expect(posts.at(0)?.$preloaded).toHaveProperty('user')
    expect(posts.at(0)?.$preloaded).toHaveProperty('comments')
    expect(posts.at(0)?.$preloaded.comments).toHaveLength(1)
    expect(posts.at(1)?.$preloaded).toHaveProperty('user')
    expect(posts.at(1)?.$preloaded).toHaveProperty('comments')
    expect(posts.at(1)?.$preloaded.comments).toHaveLength(2)
  })

  test('without method should exclude specified relationships from being auto-preloaded', async ({
    expect,
  }) => {
    class Comment extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public userId: number

      @column()
      public postId: number

      @column()
      public comment: string
    }

    class Post extends compose(BaseModel, AutoPreload) {
      public static $with = ['user', 'comments'] as const

      @column({ isPrimary: true })
      public id: number

      @column()
      public userId: number

      @column()
      public title: string

      @column()
      public content: string

      @belongsTo(() => User)
      public user: BelongsTo<typeof User>

      @hasMany(() => Comment)
      public comments: HasMany<typeof Comment>
    }

    class User extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string

      @hasMany(() => Post)
      public posts: HasMany<typeof Post>
    }

    const user = await User.create({
      email: 'john@doe.com',
      name: 'John Doe',
    })

    const post1 = new Post()
    post1.title = 'Test'
    post1.content = 'Test content'

    const post2 = new Post()
    post2.title = 'Foo'
    post2.content = 'Foo content'

    await user.related('posts').saveMany([post1, post2])

    await post1.related('comments').create({
      userId: 1,
      comment: 'Test',
    })

    await post2.related('comments').createMany([
      {
        userId: 1,
        comment: 'Bar',
      },
      {
        userId: 1,
        comment: 'Foo',
      },
    ])

    const posts = await Post.without(['comments']).query().paginate(1)

    expect(posts.at(0)?.$preloaded).toHaveProperty('user')
    expect(posts.at(0)?.$preloaded).not.toHaveProperty('comments')
    expect(posts.at(1)?.$preloaded).toHaveProperty('user')
    expect(posts.at(1)?.$preloaded).not.toHaveProperty('comments')
  })

  test('auto-preloaded array should be restored after using without method', async ({ expect }) => {
    class Comment extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public userId: number

      @column()
      public postId: number

      @column()
      public comment: string
    }

    class Post extends compose(BaseModel, AutoPreload) {
      public static $with = ['user', 'comments'] as const

      @column({ isPrimary: true })
      public id: number

      @column()
      public userId: number

      @column()
      public title: string

      @column()
      public content: string

      @belongsTo(() => User)
      public user: BelongsTo<typeof User>

      @hasMany(() => Comment)
      public comments: HasMany<typeof Comment>
    }

    class User extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string

      @hasMany(() => Post)
      public posts: HasMany<typeof Post>
    }

    const user = await User.create({
      email: 'john@doe.com',
      name: 'John Doe',
    })

    const post1 = new Post()
    post1.title = 'Test'
    post1.content = 'Test content'

    const post2 = new Post()
    post2.title = 'Foo'
    post2.content = 'Foo content'

    await user.related('posts').saveMany([post1, post2])

    await post1.related('comments').create({
      userId: 1,
      comment: 'Test',
    })

    await post2.related('comments').createMany([
      {
        userId: 1,
        comment: 'Bar',
      },
      {
        userId: 1,
        comment: 'Foo',
      },
    ])

    const posts = await Post.without(['comments']).query().paginate(1)

    expect(posts.at(0)?.$preloaded).toHaveProperty('user')
    expect(posts.at(0)?.$preloaded).not.toHaveProperty('comments')
    expect(posts.at(1)?.$preloaded).toHaveProperty('user')
    expect(posts.at(1)?.$preloaded).not.toHaveProperty('comments')

    expect(Post.$with).toStrictEqual(['user', 'comments'])
  })

  test('without method should throw an exception when relationship is not a string', async ({
    expect,
  }) => {
    class Comment extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public userId: number

      @column()
      public postId: number

      @column()
      public comment: string
    }

    class Post extends compose(BaseModel, AutoPreload) {
      public static $with = ['user', 'comments'] as const

      @column({ isPrimary: true })
      public id: number

      @column()
      public userId: number

      @column()
      public title: string

      @column()
      public content: string

      @belongsTo(() => User)
      public user: BelongsTo<typeof User>

      @hasMany(() => Comment)
      public comments: HasMany<typeof Comment>
    }

    class User extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string

      @hasMany(() => Post)
      public posts: HasMany<typeof Post>
    }

    const user = await User.create({
      email: 'john@doe.com',
      name: 'John Doe',
    })

    const post1 = new Post()
    post1.title = 'Test'
    post1.content = 'Test content'

    const post2 = new Post()
    post2.title = 'Foo'
    post2.content = 'Foo content'

    await user.related('posts').saveMany([post1, post2])

    await post1.related('comments').create({
      userId: 1,
      comment: 'Test',
    })

    await post2.related('comments').createMany([
      {
        userId: 1,
        comment: 'Bar',
      },
      {
        userId: 1,
        comment: 'Foo',
      },
    ])

    // @ts-ignore
    expect(async () => await Post.without([5]).query().paginate(1)).rejects.toThrowError()
  })

  test('withOnly method should auto-preload only specified relationships', async ({ expect }) => {
    class Comment extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public userId: number

      @column()
      public postId: number

      @column()
      public comment: string
    }

    class Post extends compose(BaseModel, AutoPreload) {
      public static $with = ['user', 'comments'] as const

      @column({ isPrimary: true })
      public id: number

      @column()
      public userId: number

      @column()
      public title: string

      @column()
      public content: string

      @belongsTo(() => User)
      public user: BelongsTo<typeof User>

      @hasMany(() => Comment)
      public comments: HasMany<typeof Comment>
    }

    class User extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string

      @hasMany(() => Post)
      public posts: HasMany<typeof Post>
    }

    const user = await User.create({
      email: 'john@doe.com',
      name: 'John Doe',
    })

    const post1 = new Post()
    post1.title = 'Test'
    post1.content = 'Test content'

    const post2 = new Post()
    post2.title = 'Foo'
    post2.content = 'Foo content'

    await user.related('posts').saveMany([post1, post2])

    await post1.related('comments').create({
      userId: 1,
      comment: 'Test',
    })

    await post2.related('comments').createMany([
      {
        userId: 1,
        comment: 'Bar',
      },
      {
        userId: 1,
        comment: 'Foo',
      },
    ])

    const posts = await Post.withOnly(['user']).query().paginate(1)

    expect(posts.at(0)?.$preloaded).toHaveProperty('user')
    expect(posts.at(0)?.$preloaded).not.toHaveProperty('comments')
    expect(posts.at(1)?.$preloaded).toHaveProperty('user')
    expect(posts.at(1)?.$preloaded).not.toHaveProperty('comments')
  })

  test('auto-preloaded array should be restored after using withOnly method', async ({
    expect,
  }) => {
    class Comment extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public userId: number

      @column()
      public postId: number

      @column()
      public comment: string
    }

    class Post extends compose(BaseModel, AutoPreload) {
      public static $with = ['user', 'comments'] as const

      @column({ isPrimary: true })
      public id: number

      @column()
      public userId: number

      @column()
      public title: string

      @column()
      public content: string

      @belongsTo(() => User)
      public user: BelongsTo<typeof User>

      @hasMany(() => Comment)
      public comments: HasMany<typeof Comment>
    }

    class User extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string

      @hasMany(() => Post)
      public posts: HasMany<typeof Post>
    }

    const user = await User.create({
      email: 'john@doe.com',
      name: 'John Doe',
    })

    const post1 = new Post()
    post1.title = 'Test'
    post1.content = 'Test content'

    const post2 = new Post()
    post2.title = 'Foo'
    post2.content = 'Foo content'

    await user.related('posts').saveMany([post1, post2])

    await post1.related('comments').create({
      userId: 1,
      comment: 'Test',
    })

    await post2.related('comments').createMany([
      {
        userId: 1,
        comment: 'Bar',
      },
      {
        userId: 1,
        comment: 'Foo',
      },
    ])

    const posts = await Post.withOnly(['user']).query().paginate(1)

    expect(posts.at(0)?.$preloaded).toHaveProperty('user')
    expect(posts.at(0)?.$preloaded).not.toHaveProperty('comments')
    expect(posts.at(1)?.$preloaded).toHaveProperty('user')
    expect(posts.at(1)?.$preloaded).not.toHaveProperty('comments')

    expect(Post.$with).toStrictEqual(['user', 'comments'])
  })

  test('withOnly method should throw an exception when relationship is not a string', async ({
    expect,
  }) => {
    class Comment extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public userId: number

      @column()
      public postId: number

      @column()
      public comment: string
    }

    class Post extends compose(BaseModel, AutoPreload) {
      public static $with = ['user', 'comments'] as const

      @column({ isPrimary: true })
      public id: number

      @column()
      public userId: number

      @column()
      public title: string

      @column()
      public content: string

      @belongsTo(() => User)
      public user: BelongsTo<typeof User>

      @hasMany(() => Comment)
      public comments: HasMany<typeof Comment>
    }

    class User extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string

      @hasMany(() => Post)
      public posts: HasMany<typeof Post>
    }

    const user = await User.create({
      email: 'john@doe.com',
      name: 'John Doe',
    })

    const post1 = new Post()
    post1.title = 'Test'
    post1.content = 'Test content'

    const post2 = new Post()
    post2.title = 'Foo'
    post2.content = 'Foo content'

    await user.related('posts').saveMany([post1, post2])

    await post1.related('comments').create({
      userId: 1,
      comment: 'Test',
    })

    await post2.related('comments').createMany([
      {
        userId: 1,
        comment: 'Bar',
      },
      {
        userId: 1,
        comment: 'Foo',
      },
    ])

    // @ts-ignore
    expect(async () => await Post.withOnly([5]).query().paginate(1)).rejects.toThrowError()
  })

  test('withoutAny method should not auto-preload any relationship', async ({ expect }) => {
    class Comment extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public userId: number

      @column()
      public postId: number

      @column()
      public comment: string
    }

    class Post extends compose(BaseModel, AutoPreload) {
      public static $with = ['user', 'comments'] as const

      @column({ isPrimary: true })
      public id: number

      @column()
      public userId: number

      @column()
      public title: string

      @column()
      public content: string

      @belongsTo(() => User)
      public user: BelongsTo<typeof User>

      @hasMany(() => Comment)
      public comments: HasMany<typeof Comment>
    }

    class User extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string

      @hasMany(() => Post)
      public posts: HasMany<typeof Post>
    }

    const user = await User.create({
      email: 'john@doe.com',
      name: 'John Doe',
    })

    const post1 = new Post()
    post1.title = 'Test'
    post1.content = 'Test content'

    const post2 = new Post()
    post2.title = 'Foo'
    post2.content = 'Foo content'

    await user.related('posts').saveMany([post1, post2])

    await post1.related('comments').create({
      userId: 1,
      comment: 'Test',
    })

    await post2.related('comments').createMany([
      {
        userId: 1,
        comment: 'Bar',
      },
      {
        userId: 1,
        comment: 'Foo',
      },
    ])

    const posts = await Post.withoutAny().query().paginate(1)

    expect(posts.at(0)?.$preloaded).not.toHaveProperty('user')
    expect(posts.at(0)?.$preloaded).not.toHaveProperty('comments')
    expect(posts.at(1)?.$preloaded).not.toHaveProperty('user')
    expect(posts.at(1)?.$preloaded).not.toHaveProperty('comments')
  })

  test('auto-preloaded array should be restored after using withoutAny method', async ({
    expect,
  }) => {
    class Comment extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public userId: number

      @column()
      public postId: number

      @column()
      public comment: string
    }

    class Post extends compose(BaseModel, AutoPreload) {
      public static $with = ['user', 'comments'] as const

      @column({ isPrimary: true })
      public id: number

      @column()
      public userId: number

      @column()
      public title: string

      @column()
      public content: string

      @belongsTo(() => User)
      public user: BelongsTo<typeof User>

      @hasMany(() => Comment)
      public comments: HasMany<typeof Comment>
    }

    class User extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string

      @hasMany(() => Post)
      public posts: HasMany<typeof Post>
    }

    const user = await User.create({
      email: 'john@doe.com',
      name: 'John Doe',
    })

    const post1 = new Post()
    post1.title = 'Test'
    post1.content = 'Test content'

    const post2 = new Post()
    post2.title = 'Foo'
    post2.content = 'Foo content'

    await user.related('posts').saveMany([post1, post2])

    await post1.related('comments').create({
      userId: 1,
      comment: 'Test',
    })

    await post2.related('comments').createMany([
      {
        userId: 1,
        comment: 'Bar',
      },
      {
        userId: 1,
        comment: 'Foo',
      },
    ])

    const posts = await Post.withoutAny().query().paginate(1)

    expect(posts.at(0)?.$preloaded).not.toHaveProperty('user')
    expect(posts.at(0)?.$preloaded).not.toHaveProperty('comments')
    expect(posts.at(1)?.$preloaded).not.toHaveProperty('user')
    expect(posts.at(1)?.$preloaded).not.toHaveProperty('comments')

    expect(Post.$with).toStrictEqual(['user', 'comments'])
  })
})
