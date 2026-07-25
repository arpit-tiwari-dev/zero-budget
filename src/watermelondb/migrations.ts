import {schemaMigrations, createTable} from '@nozbe/watermelondb/Schema/migrations';

export const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 3,
      steps: [
        createTable({
          name: 'budgets',
          columns: [
            {name: 'user_id', type: 'string', isIndexed: true},
            {name: 'category_id', type: 'string', isOptional: true, isIndexed: true},
            {name: 'amount', type: 'number'},
            {name: 'month', type: 'string', isIndexed: true},
            {name: 'budget_type', type: 'string'},
          ],
        }),
      ],
    },
    {
      // Add indexes to category_status and debtor_status for faster queries
      toVersion: 2,
      steps: [
        // Note: WatermelonDB doesn't have a direct "addIndex" migration step
        // The index will be applied automatically when the schema version changes
        // and the adapter recreates the indexes based on the updated schema
      ],
    },
  ],
});

export default migrations;
