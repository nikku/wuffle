
<script>
import CreateFilter from './CreateQuickFilter.svelte';

import { createLocalStore } from './util';

export let setFilter;
export let currentFilter;

const defaultFilter = [
  {
    name: 'Assigned to me',
    value: 'assignee:@me'
  }
];

const localStorage = createLocalStore();

let filters = localStorage.get('quickFilters', defaultFilter);
const removeFilter = (filter) => {
  filters = filters.filter(f => f !== filter);
  localStorage.set('quickFilters', filters);
};


const createFilter = name => {
  const filter = {
    name,
    value: currentFilter
  };
  filters = [ ...filters, filter ];
  localStorage.set('quickFilters', filters);
};

</script>

<div class="quickFilters navbar-collapse">
  <CreateFilter onSubmit={createFilter} />
  
  {#each filters as filter}
    <button
      class="btn btn-outline-primary ml-1 {filter.value === currentFilter ? 'active' : ''}"
        on:click={() => {
          if (filter.value !== currentFilter) {
            setFilter(filter.value);
          }
          else {
            setFilter('');
          }
        }}
    >
      <span>{filter.name}</span>
      <button class="btn removeButton" on:click={
        (e) => {
          removeFilter(filter);
          e.stopPropagation();
        }
        }>x</button>
    </button>
  {/each}

</div>

<style>
  .btn:hover .removeButton {
    display: inline;
  }

  .removeButton {
    display: none;
    line-height: normal;
    padding: 0;
    vertical-align: baseline;
    color: inherit;
    transition: none;
  }
</style>