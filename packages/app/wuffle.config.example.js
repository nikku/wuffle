/**
 * This defines board specific configuration.
 *
 * ### Name
 *
 * The name of your board, displayed in the board header.
 *
 *
 * ### Description
 *
 * Optional description of the board, will be served with the board front-end
 * for SEO purposes.
 *
 *
 * ### Columns
 *
 * Valid fields for columns are
 *
 *  * name       - unique name
 *  * label      - label, if present on a GitHub issue column will be set
 *  * closed     - if the column issues must be closed
 *  * sorting    - true if column cards should be sorted
 *                 incrementally based on links
 *  * fifo       - true to turn the default column ordering from
 *                 last in first out to first in first out
 *  * states     - a list of board states to map to this column
 *
 * The default column is the column that holds open issues without
 * any label constraints (Inbox in the example below).
 *
 *
 * ### Search Config
 *
 * You may define a default filter to apply to the board if
 * there is no user-defined search query.
 */
export default {

  name: 'My Wuffle Board',
  description: 'This board organizes all my tasks',

  columns: [
    { name: 'Inbox', label: null },
    { name: 'Backlog', label: 'backlog', sorting: true },
    { name: 'Ready', label: 'ready', sorting: true, fifo: true },
    { name: 'In Progress', label: 'in progress', sorting: true, fifo: true },
    { name: 'Needs Review', label: 'needs review', sorting: true, fifo: true },
    { name: 'Done', label: null, closed: true }
  ],

  defaultFilter: '!repo:"some/ignored-repository"'
};