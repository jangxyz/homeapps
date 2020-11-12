(() => {

  //
  const data = {
    input: undefined,
    code: undefined,
    options: {},
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

    if (input) {
      data.input = input;
    }
    if (code) {
      data.code = code;
    }

    data.options = {
      outputAnchorText: output_anchor_text,
    };
  }

  function readFromClipboard() {
    console.log(1, 'reading from clipboard..');
    const pr = window.navigator.clipboard.readText().then((content) => {
      console.log(3, 'read:', content);
      return content;
    }).catch((err) => {
      console.log(4, 'error:', err);
    });
    console.log(2, 'waiting..');

    return pr;
  }


  function attachEvents() {
    function $getInput() {
      return document.querySelector('[name="user-input"]');
    }

    function updateInput(value) {
      data.input = value;

      // update ui
      const $userInput = $getInput();
      if ($userInput && $userInput.value !== value) {
        $userInput.value = value;
      }

      // side-effects
      computeOutput();
    }

    // click!summary: clipboard => .clipboard-content
    (() => {
      const $summary = document.querySelector('summary[class="clipboard-summary"]');
      const $clipboardCode = document.querySelector('.clipboard-content');
      if (!$summary) {
        return;
      }
      $summary.addEventListener('click', (ev) => {
        readFromClipboard().then((content) => {
          //updateInput(content);
          $clipboardCode.textContent = content;
        })
      });
    })();

    // click!paste: clipboard => $userInput
    (() => {
      const $pasteButton = document.querySelector('button[name="paste-input-from-clipboard"]');
      $pasteButton.addEventListener('click', (ev) => {
        readFromClipboard().then((content) => {
          updateInput(content);
        })
      });
    })();

    // click!button[name="compute"]: compute output
    (() => {
      const $computeButton = document.querySelector('button[name="compute"]');
      $computeButton.addEventListener('click', (ev) => {
        if (data.input && data.code) {
          computeOutput();
        }
      });
    })();

    //
    (() => {
      const $userInput = $getInput();
      $userInput.addEventListener('change', (ev) => {
        updateInput(ev.target.value);
      });
      $userInput.addEventListener('paste', (ev) => {
        updateInput(ev.clipboardData.getData('text'));
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

  function computeOutput() {
    const {
      input = undefined,
      code = undefined,
      options: { outputAnchorText = undefined },
    } = data || {};

    if (!input) {
      console.log('no input:', input);
      return;
    }
    if (!code) {
      console.log('no code:', code);
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
      if (outputAnchorText) {
        $outputAnchor.textContent = outputAnchorText || 'link';
      } else {
        $outputAnchor.textContent = output || 'link';
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
    parseArgs();

    // update ui: $userInput
    (() => {
      const $userInput = document.querySelector('input[name="input"]');
      if ($userInput && data.input) {
        $userInput.value = data.input;
      }
    })();

    // update ui: $code
    (() => {
      const $code = document.querySelector('textarea[name="code"]');
      if ($code && data.code) {
        $code.value = data.code;
      }
    })();

    // compute!
    if (data.input && data.code) {
      computeOutput();
    }
  });
})();
