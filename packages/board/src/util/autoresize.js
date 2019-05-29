export default function autoresize(node, params) {

  var offset = node.offsetHeight - node.clientHeight;

  function onInput(event) {
    var target = event.target;

    target.style.height = 'auto';
    target.style.height = target.scrollHeight + offset + 'px';
  }

  document.addEventListener('input', onInput);

  return {
    destroy: function() {
      node.removeEventListener('input', onInput);
    }
  };
}