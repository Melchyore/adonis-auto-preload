<div align="center">
  <h1><b>Adonis Auto-Preload</b></h1>

  <p>Auto-preload multiple relationships when retrieving Lucid models</p>

  <p>
    <a href="https://github.com/Melchyore/adonis-auto-preload/actions/workflows/test.yml" target="_blank">
      <img alt="Build" src="https://img.shields.io/github/workflow/status/Melchyore/adonis-auto-preload/test?style=for-the-badge" />
    </a>
    <a href="https://npmjs.org/package/@melchyore/adonis-auto-preload" target="_blank">
      <img alt="npm" src="https://img.shields.io/npm/v/@melchyore/adonis-auto-preload.svg?style=for-the-badge&logo=npm" />
    </a>
    <a href="https://github.com/Melchyore/adonis-auto-preload/blob/master/LICENSE.md" target="_blank">
      <img alt="License: MIT" src="https://img.shields.io/npm/l/@melchyore/adonis-auto-preload?color=blueviolet&style=for-the-badge" />
    </a>
    <img alt="Typescript" src="https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript" />
  </p>
</div>

## **Pre-requisites**
> Node.js >= 16.17.0

## **Installation**

```sh
npm install @melchyore/adonis-auto-preload
# or
yarn add @melchyore/adonis-auto-preload
# or
pnpm install @melchyore/adonis-auto-preload
```
## **Configure**
```sh
node ace configure @melchyore/adonis-auto-preload
```

## **Usage**
Extend from the AutoPreload mixin and add a new `static $with` attribute.

Adding `as const` to `$with` array will let the compiler know about your relationship names and infer them so you will have better intellisense when using `without` and `withOnly` methods.

Relationships will be auto-preloaded for `find`, `all` and `paginate` queries.

### **Using relation name**
```ts
// App/Models/User.ts

import { BaseModel, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import { compose } from '@ioc:Adonis/Core/Helpers'

import { AutoPreload } from '@ioc:Adonis/Addons/AutoPreload'

import Post from 'App/Models/Post'

class User extends compose(BaseModel, AutoPreload) {
  public static $with = ['posts'] as const

  @column({ isPrimary: true })
  public id: number

  @column()
  public email: string

  @hasMany(() => Post)
  public posts: HasMany<typeof Post>
}
```

```ts
// App/Controllers/Http/UsersController.ts

import User from 'App/Models/User'

export default class UsersController {
  public async show() {
    return await User.find(1) // ⬅ Returns user with posts attached.
  }
}
```

### **Using function**
You can also use functions to auto-preload relationships. The function will receive the model query builder as the only argument.

```ts
// App/Models/User.ts

import { BaseModel, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import { compose } from '@ioc:Adonis/Core/Helpers'

import { AutoPreload } from '@ioc:Adonis/Addons/AutoPreload'

import Post from 'App/Models/Post'

class User extends compose(BaseModel, AutoPreload) {
  public static $with = [
    (query: ModelQueryBuilderContract<typeof this>) => {
      query.preload('posts')
    }
  ]

  @column({ isPrimary: true })
  public id: number

  @column()
  public email: string

  @hasMany(() => Post)
  public posts: HasMany<typeof Post>
}
```

```ts
// App/Controllers/Http/UsersController.ts

import User from 'App/Models/User'

export default class UsersController {
  public async show() {
    return await User.find(1) // ⬅ Returns user with posts attached.
  }
}
```

## **Nested relationships**
You can auto-preload nested relationships using the dot "." between the parent model and the child model. In the following example, `User` -> hasMany -> `Post` -> hasMany -> `Comment`.

```ts
// App/Models/Post.ts

import { BaseModel, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import { compose } from '@ioc:Adonis/Core/Helpers'

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
```

```ts
// App/Models/User.ts

import { BaseModel, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import { compose } from '@ioc:Adonis/Core/Helpers'

import { AutoPreload } from '@ioc:Adonis/Addons/AutoPreload'

import Post from 'App/Models/Post'

class User extends compose(BaseModel, AutoPreload) {
  public static $with = ['posts.comments'] as const

  @column({ isPrimary: true })
  public id: number

  @column()
  public email: string

  @hasMany(() => Post)
  public posts: HasMany<typeof Post>
}
```

When retrieving a user, it will preload both `posts` and `comments` (`comments` will be attached to their `posts` parents objects).

You can also use functions to auto-preload nested relationships.

```ts
public static $with = [
  (query: ModelQueryBuilderContract<typeof this>) => {
    query.preload('posts', (postsQuery) => {
      postsQuery.preload('comments')
    })
  }
]
```

## **Mixin methods**
The `AutoPreload` mixin will add 3 methods to your models. We will explain all of them below.

We will use the following model for our methods examples.

```ts
// App/Models/User.ts

import { BaseModel, column, hasOne, HasOne, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import { compose } from '@ioc:Adonis/Core/Helpers'

import { AutoPreload } from '@ioc:Adonis/Addons/AutoPreload'

import Profile from 'App/Models/Profile'
import Post from 'App/Models/Post'

class User extends compose(BaseModel, AutoPreload) {
  public static $with = ['posts', 'profile'] as const

  @column({ isPrimary: true })
  public id: number

  @column()
  public email: string

  @hasOne(() => Profile)
  public profile: HasOne<typeof Profile>

  @hasMany(() => Post)
  public posts: HasMany<typeof Post>
}
```

### **without**
This method takes an array of relationship names as the only argument. All specified relationships will not be auto-preloaded. You cannot specify relationships registered using functions.

```ts
// App/Controllers/Http/UsersController.ts

import User from 'App/Models/User'

export default class UsersController {
  public async show() {
    return await User.without(['posts']).find(1) // ⬅ Returns user with profile and without posts.
  }
}
```

### **withOnly**
This method takes an array of relationship names as the only argument. Only specified relationships will be auto-preloaded. You cannot specify relationships registered using functions.

```ts
// App/Controllers/Http/UsersController.ts

import User from 'App/Models/User'

export default class UsersController {
  public async show() {
    return await User.withOnly(['profile']).find(1) // ⬅ Returns user with profile and without posts.
  }
}
```

### **withoutAny**
Exclude all relationships from being auto-preloaded.

```ts
// App/Controllers/Http/UsersController.ts

import User from 'App/Models/User'

export default class UsersController {
  public async show() {
    return await User.withoutAny().find(1) // ⬅ Returns user without profile and posts.
  }
}
```

## **Limitations**
- Consider the following scenario: `User` -> hasMany -> `Post` -> hasMany -> `Comments`. If you auto-preload `user` and `comments` from `Post` and you auto-preload `posts` from `User`, you will end-up in a infinite loop and your application will stop working.

## **Route model binding**
When using route model binding, you cannot use `without`, `withOnly` and `withoutAny` methods in your controller. But, you can make use of [findForRequest](https://github.com/adonisjs/route-model-binding#change-lookup-logic) method.

```ts
// App/Models/User.ts

import { BaseModel, column, hasOne, HasOne, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import { compose } from '@ioc:Adonis/Core/Helpers'

import { AutoPreload } from '@ioc:Adonis/Addons/AutoPreload'

import Profile from 'App/Models/Profile'
import Post from 'App/Models/Post'

class User extends compose(BaseModel, AutoPreload) {
  public static $with = ['posts', 'profile'] as const

  @column({ isPrimary: true })
  public id: number

  @column()
  public email: string

  @hasOne(() => Profile)
  public profile: HasOne<typeof Profile>

  @hasMany(() => Post)
  public posts: HasMany<typeof Post>

  public static findForRequest(ctx, param, value) {
    const lookupKey = param.lookupKey === '$primaryKey' ? 'id' : param.lookupKey

    return this
      .without(['posts']) // ⬅ Do not auto-preload posts when using route model binding.
      .query()
      .where(lookupKey, value)
      .firstOrFail()
  }
}
```

## **Run tests**

```sh
npm run test
```

## **Author**

👤 **Oussama Benhamed**

* Twitter: [@Melchyore](https://twitter.com/Melchyore)
* Github: [@Melchyore](https://github.com/Melchyore)

## 🤝 **Contributing**

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/Melchyore/adonis-auto-preload/issues). You can also take a look at the [contributing guide](https://github.com/Melchyore/adonis-auto-preload/blob/master/CONTRIBUTING.md).

## **Show your support**

Give a ⭐️ if this project helped you!

<a href="https://www.patreon.com/melchyore">
  <img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" width="160">
</a>

## 📝 **License**

Copyright © 2022 [Oussama Benhamed](https://github.com/Melchyore).<br />
This project is [MIT](https://github.com/Melchyore/adonis-auto-preload/blob/master/LICENSE.md) licensed.
