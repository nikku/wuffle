const defaultColumns = [
  { name: 'Inbox', label: null },
  { name: 'Backlog', label: 'backlog' },
  { name: 'Ready', label: 'ready' },
  { name: 'In Progress', label: 'in progress' },
  { name: 'Needs Review', label: 'needs review' },
  { name: 'Done', label: null, closed: true }
];

module.exports = function loadConfig() {

  try {
    return require('../wuffle.config.js');
  } catch (error) {
    return {
      columns: defaultColumns,
      repositories: []
    };
  }

};