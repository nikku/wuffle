<script>
    export let linktype;
    export let state;

    $: depends_ons = linktype === 'DEPENDS_ON';
    $: required_by = linktype === 'REQUIRED_BY';
    $: linked_to = linktype === 'LINKED_TO'||'CONNECTS';

    $: depends_on_open = (depends_ons && state === 'open');
    $: depends_on_closed = (depends_ons && state === 'closed');
</script>

{#if depends_on_open}
<svg class="icons" class:depends_ons={ depends_ons } class:required_by={ required_by } class:linked_to={ linked_to } width="16" height="1rem" viewBox="0 0 16 16" version="1.1" aria-hidden="true">
    <ellipse stroke="#ff0000" ry="6.968783" rx="6.874805" id="svg_29" cy="7.933599" cx="8.03102" stroke-width="2" fill="none"/>
    <line stroke="#ff0000" transform="rotate(5.70456600189209 8.06225395202641,8.277313232421868) " stroke-linecap="null" stroke-linejoin="null" id="svg_30" y2="3.244733" x2="12.248203" y1="13.309893" x1="3.876306" stroke-opacity="null" stroke-width="2" fill="none"/>
</svg>
{:else if depends_on_closed}
<svg class="icons" class:depends_ons={ depends_ons } class:required_by={ required_by } class:linked_to={ linked_to } width="16" height="1rem" viewBox="0 0 16 16" version="1.1" aria-hidden="true">
    <path stroke="#00bf00" transform="rotate(0.14741696417331696 8.086352348327475,8.011971473693853) " id="svg_8" d="m0.564684,6.973556l1.616439,-2.275429l4.428208,6.230494l7.38168,-10.384157l1.61701,2.273821l-8.99869,12.661194" stroke-width="0.5" fill="#00bf00"/>
</svg>
{:else if required_by}
<svg class="icons" class:depends_ons={ depends_ons } class:required_by={ required_by } class:linked_to={ linked_to }  width="16" height="1rem" viewBox="0 0 16 16" version="1.1" aria-hidden="true">
    <ellipse stroke="#ff7f00" ry="6.656106" rx="6.71865" id="svg_1" cy="7.996092" cx="8.062499" stroke-width="2.5" fill="none"/>
    <text xml:space="preserve" text-anchor="start" font-family="Helvetica, Arial, sans-serif" font-size="24" id="svg_4" y="11.390794" x="3.496004" stroke-width="0" fill="#ff7f00" transform="matrix(1.1504424810409546,0,0,0.4875895761468956,-0.5782632865011692,6.89502937836951) " stroke="#ff7f00">!</text>
</svg>
{:else if linked_to}
<svg class="icons" class:depends_ons={ depends_ons } class:required_by={ required_by } class:linked_to={ linked_to } width="16" height="1rem" viewBox="0 0 16 16" version="1.1" aria-hidden="true">
    <ellipse fill="none" stroke-width="2" cx="7.968748" cy="7.996094" id="svg_1" rx="7.187498" ry="7.218748" stroke="#666666"/>
    <text fill="#666666" stroke-width="0" x="7.696416" y="6.301741" id="svg_2" font-size="24" font-family="'Times New Roman', Times, serif" text-anchor="start" xml:space="preserve" font-style="italic" transform="rotate(-25.128538131713867 7.519455432891845,8.122852325439453) matrix(1.087352986988563,0,0,0.5180052125258933,-4.470349859436378,9.040702392408976) " stroke="#666666">i</text>
</svg>
{/if}