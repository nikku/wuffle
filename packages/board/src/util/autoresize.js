export default function autoresize(node, params) {

  var offset = node.offsetHeight - node.clientHeight;

  function updateHeight() {
    node.style.height = 'auto';
    node.style.height = node.scrollHeight + offset + 'px';
  }

  node.addEventListener('input', updateHeight);
  node.addEventListener('focus', updateHeight);

  return {
    destroy: function() {
      node.removeEventListener('input', updateHeight);
      node.removeEventListener('focus', updateHeight);
    }
  };
}