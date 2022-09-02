import type { ModelQueryBuilderContract } from '@ioc:Adonis/Lucid/Orm'
import type { AutoPreloadMixin } from '@ioc:Adonis/Addons/AutoPreload'

import WrongRelationshipTypeException from '../Exceptions/WrongRelationshipTypeException'
import WrongArgumentTypeException from '../Exceptions/WrongArgumentTypeException'

export const AutoPreload: AutoPreloadMixin = (superclass) => {
  class AutoPreloadModel extends superclass {
    public static $with: Array<any> = []

    protected static $originalWith: Array<any> = []

    public static boot() {
      if (this.booted) {
        return
      }

      if (this.$with.length > 0) {
        const isWrongType = this.$with.every((relationship) => {
          return !['function', 'string'].includes(typeof relationship)
        })

        if (isWrongType) {
          throw WrongRelationshipTypeException.invoke(this.name)
        }
      }

      super.boot()

      this.$originalWith = [...this.$with]

      for (const hook of ['fetch', 'find'] as const) {
        this.before(hook, (query: any) => {
          this.handleAutoPreload(query)
        })
      }

      this.before(
        'paginate',
        ([_, query]: [
          ModelQueryBuilderContract<typeof this>,
          ModelQueryBuilderContract<typeof this>
        ]) => {
          this.handleAutoPreload(query, false)
        }
      )
    }

    public static without(relationships: any): any {
      this.checkArrayOfRelationships('without', relationships)

      this.$with = this.$with.filter((relationship) => {
        if (typeof relationship === 'string') {
          return !relationships.includes(relationship)
        } else if (typeof relationship === 'function') {
          return relationship
        } else {
          throw WrongArgumentTypeException.invoke(relationship)
        }
      })

      return this
    }

    public static withOnly(relationships: any): any {
      this.checkArrayOfRelationships('withOnly', relationships)

      this.$with = this.$with.filter((relationship) => {
        if (typeof relationship === 'string') {
          return relationships.includes(relationship)
        } else if (typeof relationship === 'function') {
          return relationship
        } else {
          throw WrongArgumentTypeException.invoke(relationship)
        }
      })

      return this
    }

    public static withoutAny(): any {
      this.$with = []

      return this
    }

    private static handleAutoPreload(
      query: ModelQueryBuilderContract<typeof this>,
      restorePreloads = true
    ) {
      const preloads = this.$with

      if (preloads.length > 0) {
        for (const preload of preloads) {
          if (typeof preload === 'string') {
            if (preload.includes('.')) {
              this.handleNestedRelationships(query, preload.split('.') as any)
            } else {
              query.preload(preload as any)
            }
          } else if (typeof preload === 'function') {
            preload(query)
          }
        }
      }

      if (restorePreloads) {
        this.$with = [...this.$originalWith]
      }
    }

    /**
     * Recursive function to handle nested relationships.
     */
    private static handleNestedRelationships(
      query: ModelQueryBuilderContract<typeof this>,
      relationships: any
    ) {
      if (relationships.length > 0) {
        const nextRelation = relationships.shift()

        if (nextRelation) {
          query.preload(nextRelation, (qb: any) => {
            if (relationships.length > 0) {
              this.handleNestedRelationships(qb, relationships)
            }
          })
        }
      }
    }

    private static checkArrayOfRelationships(method: string, relationships: Array<any>) {
      if (relationships.length > 0) {
        const isWrongType = relationships.every((relationship: any) => {
          return !['function', 'string'].includes(typeof relationship)
        })

        if (isWrongType) {
          throw WrongArgumentTypeException.invoke(method)
        }
      }
    }
  }

  return AutoPreloadModel
}
