declare module '@ioc:Adonis/Addons/AutoPreload' {
  import type {
    LucidModel,
    LucidRow,
    ModelQueryBuilderContract,
    ExtractModelRelations,
    ModelRelations,
  } from '@ioc:Adonis/Lucid/Orm'
  import type { NormalizeConstructor } from '@ioc:Adonis/Core/Helpers'

  type GetWith<T> = T extends AutoPreloadModel
    ? T['$with'][number] extends infer Item
      ? Item extends string
        ? Item
        : never
      : never
    : never

  type GetNestedRelationships<
    RelatedModel extends LucidModel,
    Relationships extends keyof RelatedModel
  > = RelatedModel[Relationships]

  export type Relationships<
    Model extends LucidModel,
    ModelRelationships = ExtractModelRelations<InstanceType<Model>>
  > = ReadonlyArray<ModelRelationships>

  export interface AutoPreloadModel extends LucidModel {
    //$preloads: Array<ExtractModelRelations<InstanceType<typeof this>>>
    //$preloads<T extends this, Name extends ExtractModelRelations<InstanceType<T>>>(): Array<Name>
    $with: any
  }

  export interface AutoPreloadMixin {
    <T extends NormalizeConstructor<LucidModel>>(superclass: T): T &
      AutoPreloadModel & {
        new (...args: Array<any>): LucidRow

        //$with: Array<string | ((query: ModelQueryBuilderContract<typeof this>) => void)>
        without<U extends LucidModel>(this: U, relationships: Array<GetWith<U>>): U
        withOnly<U extends LucidModel>(this: U, relationships: Array<GetWith<U>>): U
        withoutAny<U extends LucidModel>(this: U): U
      }
  }

  const AutoPreload: AutoPreloadMixin

  export { AutoPreload }
}
