(() => {

  //
  const data = {
    clipboardContent: undefined,
  };


  //
  function parseQuery(search) {
    return search.replace(/^\?/, '').split('&').map((kvStr) =>
      kvStr.split('=')
    ).reduce((memo, [key, value]) => Object.assign(memo, {[key]: decodeURIComponent(value)}), {})
  }

  function parseArgs() {
    const queryMap = parseQuery(window.location.search);
    const { input, code, output_anchor_text } = queryMap;

    return {
      input,
      code,
      output_anchor_text,
    };
  }


  function readFromClipboard() {
    if (data.clipboardContent !== undefined) {
      return Promise.resolve(data.clipboardContent);
    }

    console.log(1, 'reading from clipboard..');
    const pr = window.navigator.clipboard.readText().then((content) => {
      console.log(3, 'read:', content);
      data.clipboardContent = content;
      return content;
    }).catch((err) => {
      console.log(4, 'error:', err);
    });
    console.log(2, 'waiting..');

    return pr;
  }

  function attachEvents() {
    //
    (() => {
      const $summary = document.querySelector('summary[class="clipboard-summary"]');
      const $clipboardCode = document.querySelector('.clipboard-content');
      $summary.addEventListener('click', (ev) => {
        readFromClipboard().then((content) => {
          $clipboardCode.textContent = content;
        })
      });
    })();

    //
    (() => {
      const $input = document.querySelector('input[name="input"]');
      const $pasteButton = document.querySelector('button[name="paste-input-from-clipboard"]');
      $pasteButton.addEventListener('click', (ev) => {
        readFromClipboard().then((content) => {
          $input.value = content;
        })
      });
    })();
  }

  // doesn't support iOS Safari as of 14.
  // check https://caniuse.com/?search=permissions%20api
  function queryPermission() {
    return navigator.permissions.query({
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
  }

  function computeOutput({ code, input, output_anchor_text }) {
    if (!input) {
      return;
    }

    const $outputTextarea = document.querySelector('[name="output-textarea"]');
    const $outputAnchor = document.querySelector('a.output-anchor');
    try {
      function buildFunction(body, input) {
        return new Function(`"use strict"; return (input) => ${body}`)();
      }
      const runner = buildFunction(code);
      console.log(runner);

      const output = runner(input);
      console.log(output);

      $outputTextarea.value = output;
      $outputAnchor.setAttribute('href', output);
      if (output_anchor_text) {
        $outputAnchor.textContent = output_anchor_text || '';
      } else {
        $outputAnchor.textContent = output || '';
      }
    } catch (err) {
      console.error(err);
    }
  }

  //
  // start.
  window.addEventListener('DOMContentLoaded', () => {
    // print permission
    //queryPermission();

    /////
    //readFromClipboard().then((content) => {
    //  console.log(content);
    //})

    attachEvents();

    //
    const { input, code, output_anchor_text } = parseArgs();
    //
    (() => {
      const $input = document.querySelector('input[name="input"]');
      if ($input && input) {
        $input.value = input;
      }
    })();

    //
    (() => {
      const $code = document.querySelector('textarea[name="code"]');
      if ($code && code) {
        $code.value = code;
      }
    })();

    // compute!
    computeOutput({ input, code, output_anchor_text });
  });
})();
