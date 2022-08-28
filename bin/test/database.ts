import type { DatabaseContract } from '@ioc:Adonis/Lucid/Database'

export async function createUsersTable(Database: DatabaseContract) {
  await Database.connection().schema.dropTableIfExists('users')
  await Database.connection().schema.createTable('users', (table) => {
    table.increments('id')
    table.string('email', 255).notNullable()
    table.string('name', 255).notNullable()
    table.timestamp('created_at', { useTz: true })
  })
}

export async function createPostsTable(Database: DatabaseContract) {
  await Database.connection().schema.dropTableIfExists('posts')
  await Database.connection().schema.createTable('posts', (table) => {
    table.increments('id')
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('')
    table.string('title', 100).notNullable()
    table.text('content', 'longtext').notNullable()
    table.timestamp('created_at', { useTz: true })
    table.timestamp('updated_at', { useTz: true })
  })
}

export async function createCommentsTable(Database: DatabaseContract) {
  await Database.connection().schema.dropTableIfExists('comments')
  await Database.connection().schema.createTable('comments', (table) => {
    table.increments('id')
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('')
    table.integer('post_id').unsigned().references('id').inTable('posts').onDelete('')
    table.string('comment', 255).notNullable()
    table.timestamp('created_at', { useTz: true })
    table.timestamp('updated_at', { useTz: true })
  })
}

export async function setupDatabase(Database: DatabaseContract) {
  await createUsersTable(Database)
  await createPostsTable(Database)
  await createCommentsTable(Database)
}

export async function cleanDatabase(Database: DatabaseContract) {
  await Database.connection().dropAllTables()
  await Database.manager.closeAll()
}
