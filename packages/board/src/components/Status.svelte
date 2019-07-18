<script>
  export let state;
  export let onClick;
  export let length;

  $: pending = state === 'pending';
  $: success = state === 'success';
  $: failure = state === 'failure';
  $: onClick = onClick || '';
  $: size = ((100/length-1))+'%';

</script>


<svg  width={ size } height="3" class:pending={ pending } class:success={ success } class:failure={ failure }>
{#if pending}
  <line x1="0" y1="0" x2="100%" y2="0" stroke="#f7d643" stroke-width="10"/>
{:else if success}
  <line x1="0" y1="0" x2="100%" y2="0" stroke="#19692c" stroke-width="10"/>
{:else if failure}
  <line x1="0" y1="0" x2="100%" y2="0" stroke="#b21f2d" stroke-width="10"/>
{/if}
</svg>
