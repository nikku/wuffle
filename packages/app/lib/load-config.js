import path from 'node:path';

const defaultColumns = [
  { name: 'Inbox', label: null },
  { name: 'Backlog', label: 'backlog' },
  { name: 'Ready', label: 'ready' },
  { name: 'In Progress', label: 'in progress' },
  { name: 'Needs Review', label: 'needs review' },
  { name: 'Done', label: null, closed: true }
];

export default async function loadConfig(log) {

  if (process.env.BOARD_CONFIG) {
    try {
      return JSON.parse(process.env.BOARD_CONFIG);
    } catch (err) {
      log.error(err, 'failed to load config from env.BOARD_CONFIG');
    }
  }

  try {
    const {
      default: config
    } = await import(path.resolve('wuffle.config.js'));

    return config;
  } catch (err) {
    log.error(err, 'failed to load config from wuffle.config.js');
  }

  return {
    columns: defaultColumns
  };

}