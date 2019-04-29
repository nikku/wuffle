module.exports = {
  columns: [
    { name: 'Inbox', label: null },
    { name: 'Ideas', label: 'backlog' },
    { name: 'Roadmap', label: 'roadmap' },
    { name: 'Ready', label: 'ready' },
    { name: 'In Progress', label: 'in progress' },
    { name: 'Needs Review', label: 'needs review' },
    { name: 'Done', label: null, closed: true }
  ],
  repositories: [
    'nikku/testtest',
    'nikku/testtest-checks',
    'nikku/testtest-non-existing',
    'nikku/testtest-private'
  ]
};