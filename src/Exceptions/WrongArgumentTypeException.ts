import { Exception } from '@poppinss/utils'

export default class WrongArgumentTypeException extends Exception {
  public static invoke(method: string) {
    return new this(
      `The method ${method} accepts only an array of strings`,
      500,
      'E_WRONG_ARGUMENT_TYPE'
    )
  }
}
