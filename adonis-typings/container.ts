declare module '@ioc:Adonis/Core/Application' {
  import type { AutoPreloadMixin } from '@ioc:Adonis/Addons/AutoPreload'

  export interface ContainerBindings {
    'Adonis/Addons/AutoPreload': {
      AutoPreload: AutoPreloadMixin
    }
  }
}
