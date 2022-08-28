import { ApplicationContract } from '@ioc:Adonis/Core/Application'

export default class AutoPreloadProvider {
  public static needsApplication = true

  constructor(protected app: ApplicationContract) {}

  public register() {
    this.app.container.singleton('Adonis/Addons/AutoPreload', () => {
      const { AutoPreload } = require('../src/Mixins/AutoPreload')

      return { AutoPreload }
    })
  }

  public async boot() {}

  public async ready() {}

  public async shutdown() {}
}
