import { Exception } from '@poppinss/utils'

export default class WrongRelationshipTypeException extends Exception {
  public static invoke(model: string) {
    return new this(
      `The model "${model}" has wrong relationships to be auto-preloaded. Only string and function types are allowed`,
      500,
      'E_WRONG_RELATIONSHIP_TYPE'
    )
  }
}
