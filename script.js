(() => {
  function parseQuery(search) {
    return search.replace(/^\?/, '').split('&').map((kvStr) =>
      kvStr.split('=')
    ).reduce((memo, [key, value]) => Object.assign(memo, {[key]: decodeURIComponent(value)}), {})
  }

  function attachEvents() {
    const $input = document.querySelector('input[name="input"]');
    const $pasteButton = document.querySelector('button[name="paste-input-from-clipboard"]');
    $pasteButton.addEventListener('click', (ev) => {
      window.navigator.clipboard.readText().then((content) => {
        $input.value = content;
      });
    });
  }

  window.addEventListener('DOMContentLoaded', () => {
    const $input = document.querySelector('input[name="input"]');

    const queryMap = parseQuery(window.location.search);
    console.log(queryMap);
    const { input, code } = queryMap;

    //
    navigator.permissions.query({
      name: 'clipboard-read',
      allowWithoutGesture: true,
    }).then((permissionStatus) => {
      // Will be 'granted', 'denied' or 'prompt':
      console.log(permissionStatus.state);

      // Listen for changes to the permission state
      permissionStatus.onchange = () => {
        console.log(permissionStatus.state);
      };
    })


    //
    if ($input && input) {
      $input.value = input;
    }

    //
    const $code = document.querySelector('textarea[name="code"]');
    if ($code && code) {
      $code.value = code;
    }

    attachEvents();

    // compute!
    const $outputTextarea = document.querySelector('[name="output-textarea"]');
    const $outputAnchor = document.querySelector('a[class="output-anchor"]');
    try {
      function compute(body, input) {
        return new Function(`"use strict"; return (input) => ${body}`)();
      }
      const output = compute(code)(input);
      console.log(output);
      $outputTextarea.value = output;
      $outputAnchor.setAttribute('href', output);
      if (queryMap.output_anchor_text) {
        $outputAnchor.textContent = queryMap.output_anchor_text;
      } else {
        $outputAnchor.textContent = output;
      }
    } catch (err) {
      console.error(err);
    }
  });
})();

