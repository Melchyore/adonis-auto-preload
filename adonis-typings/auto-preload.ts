declare module '@ioc:Adonis/Addons/AutoPreload' {
  import type { LucidModel, ExtractModelRelations } from '@ioc:Adonis/Lucid/Orm'
  import type { NormalizeConstructor } from '@ioc:Adonis/Core/Helpers'

  type GetWith<T> = T extends { $with: any }
    ? T['$with'][number] extends infer Item
      ? Item extends string
        ? Item
        : never
      : never
    : never

  export interface AutoPreloadMixin {
    <T extends NormalizeConstructor<LucidModel>>(superclass: T): T & {
      $with: any

      without<U extends LucidModel>(this: U, relationships: Array<GetWith<U>>): U
      withOnly<U extends LucidModel>(this: U, relationships: Array<GetWith<U>>): U
      withoutAny<U extends LucidModel>(this: U): U

      new (...args: Array<any>): {}
    }
  }

  const AutoPreload: AutoPreloadMixin

  export { AutoPreload }
}
