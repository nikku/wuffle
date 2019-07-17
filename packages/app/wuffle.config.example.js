/**
 * This defines all columns for the board as well as
 * repositories to be synced.
 *
 *
 * ## Columns
 *
 * Valid fields for columns are
 *
 *  * name       - unique name
 *  * label      - label, if present on a GitHub issue column will be set
 *  * closed     - if the column issues must be closed
 *  * sorting    - true if column cards should be sorted
 *                 incrementally based on links
 *
 * The default column is the column that holds open issues without
 * any label constraints (Inbox in the example below).
 *
 *
 * ## Repositories
 *
 * Repositories must be matched by their short name {owner}/{repoName}.
 *
 */
module.exports = {
  columns: [
    { name: 'Inbox', label: null },
    { name: 'Backlog', label: 'backlog', sorting: true },
    { name: 'Ready', label: 'ready', sorting: true },
    { name: 'In Progress', label: 'in progress', sorting: true },
    { name: 'Needs Review', label: 'needs review', sorting: true },
    { name: 'Done', label: null, closed: true }
  ],
  repositories: []
};