import { mount } from 'svelte';

import Taskboard from './Taskboard.svelte';

console.timeEnd('Wuffle#load');

console.time('Taskboard#create');

const taskboard = mount(Taskboard, {
  target: document.body
});

console.timeEnd('Taskboard#create');

export default taskboard;