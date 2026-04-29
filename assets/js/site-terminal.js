(() => {
  const TERMINAL_STYLE_ID = "milancholyTerminalStyles";
  const TERMINAL_TRIGGER_ID = "milancholyTerminalTrigger";
  const TERMINAL_WINDOW_ID = "milancholyTerminalWindow";
  const TERMINAL_OUTPUT_ID = "milancholyTerminalOutput";
  const TERMINAL_INPUT_ID = "milancholyTerminalInput";
  const HELP_WINDOW_ID = "milancholyHelpWindow";
  const STICKER_ROTATE_BUTTON_ID = "milancholyStickerRotateButton";
  const GAME_SCRIPT_ATTRIBUTE = "data-milancholy-game-script";
  const PHYSICS_CLASS = "milancholy-physics-active";
  const PHYSICS_ITEM_CLASS = "milancholy-physics-item";
  const PHYSICS_PLACEHOLDER_CLASS = "milancholy-physics-placeholder";
  const PARTY_CLASS = "milancholy-party-active";
  const PARTY_NODE_CLASS = "milancholy-party-node";
  const PARTY_IMAGE_CLASS = "milancholy-party-image";
  const PARTY_SURFACE_CLASS = "milancholy-party-surface";
  const PARTY_WINDOW_CLASS = "milancholy-party-window";
  const COMMAND_HELP = [
    { name: "gravity", description: "Turns visible pieces into draggable objects with strong gravity." },
    { name: "space", description: "Uses low gravity and bouncier movement for the draggable pieces." },
    { name: "stickers", description: "Lets you place the draggable pieces anywhere without gravity." },
    { name: "party", description: "Cycles the colors of visible site elements." },
    { name: "help", description: "Opens this command list in a separate window." },
    { name: "minesweeper", description: "Opens the Minesweeper window." },
    { name: "bubble wrap", description: "Opens the Bubble Wrap window." },
    { name: "runner", description: "Jumps to the Runner page." },
  ];
  const TEXT_FIELD_SELECTOR = [
    'input:not([type])',
    'input[type="text"]',
    'input[type="search"]',
    'input[type="email"]',
    'input[type="url"]',
    'input[type="tel"]',
    'input[type="password"]',
    "textarea",
  ].join(", ");
  const DEFAULT_SINGLE_LINE_LIMIT = 256;
  const DEFAULT_MULTI_LINE_LIMIT = 2000;
  const WINDOW_MARGIN = 12;
  const MAX_PHYSICS_ITEMS = 180;
  const MAX_RELEASE_SPEED = 1400;
  const RUNNER_URL = "https://milancholy.com/run";
  const HEADER_CONTENT_SELECTOR = "#header .content";
  const HEADER_TITLE_SELECTOR = "#header .content .inner h1";
  const HEADER_SUBTITLE_SELECTOR = "#header .content .inner p";
  const DETACHED_HEADER_TEXT_SELECTOR = `${HEADER_TITLE_SELECTOR}, ${HEADER_SUBTITLE_SELECTOR}`;
  const IMAGE_WRAPPER_SELECTOR = ".image";
  const PREFERRED_PHYSICS_SELECTORS = [
    ".site-corner-tool",
    "#header .logo",
    HEADER_CONTENT_SELECTOR,
    DETACHED_HEADER_TEXT_SELECTOR,
    "#header nav ul li",
    IMAGE_WRAPPER_SELECTOR,
  ].join(", ");
  const PARTY_TARGET_SELECTORS = [
    ".site-corner-tool",
    ".xp-search-window",
    "#header .logo",
    HEADER_CONTENT_SELECTOR,
    DETACHED_HEADER_TEXT_SELECTOR,
    '[data-is-detached-text-clone="true"]',
    "#header nav ul li",
    "#main .image",
    "#main h1",
    "#main h2",
    "#main h3",
    "#main h4",
    "#main h5",
    "#main h6",
    "#main p",
    "#main li",
    "#main a",
    "#main blockquote",
    "#main .button",
    "#main button",
    "#footer p",
    `#${STICKER_ROTATE_BUTTON_ID}`,
  ].join(", ");
  const ATOMIC_TAGS = new Set([
    "a",
    "audio",
    "blockquote",
    "button",
    "canvas",
    "code",
    "figcaption",
    "figure",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "img",
    "input",
    "label",
    "p",
    "pre",
    "select",
    "spo",
    "textarea",
    "video",
  ]);
  const SKIP_TAGS = new Set([
    "script",
    "style",
    "link",
    "meta",
    "title",
    "noscript",
    "source",
  ]);
  const PHYSICS_MODES = {
    gravity: {
      label: "gravity",
      gravity: 2450,
      air: 0.982,
      floorBounce: 0.18,
      wallBounce: 0.28,
      ceilingBounce: 0.2,
      floorFriction: 0.84,
      driftStrength: 0,
      initialKickX: 165,
      initialKickY: 210,
      restSpeed: 46,
      spinScale: 0.025,
    },
    space: {
      label: "space",
      gravity: 115,
      air: 0.9987,
      floorBounce: 0.58,
      wallBounce: 0.64,
      ceilingBounce: 0.56,
      floorFriction: 0.992,
      driftStrength: 4,
      initialKickX: 42,
      initialKickY: 8,
      restSpeed: 4,
      spinScale: 0.022,
    },
    stickers: {
      label: "stickers",
      gravity: 0,
      air: 1,
      floorBounce: 0,
      wallBounce: 0,
      ceilingBounce: 0,
      floorFriction: 1,
      driftStrength: 0,
      initialKickX: 0,
      initialKickY: 0,
      restSpeed: 0,
      spinScale: 0,
      releaseInertia: false,
    },
  };
  const WINDOW_COMMANDS = {
    minesweeper: {
      label: "Minesweeper",
      windowId: "minesweeperWindow",
      apiName: "minesweeper",
      scriptId: "minesweeper",
      scriptPath: "/assets/js/minesweeper.js",
    },
    "bubble wrap": {
      label: "Bubble Wrap",
      windowId: "bubbleWrapWindow",
      apiName: "bubbleWrap",
      scriptId: "bubble-wrap",
      scriptPath: "/assets/js/bubble-wrap.js",
    },
  };

  const state = {
    bootLogged: false,
    physicsMode: null,
    physicsItems: [],
    physicsFrameId: 0,
    physicsLastTime: 0,
    activeDrag: null,
    allowProgrammaticUiEvent: false,
    partyMode: false,
    partyNodes: [],
    partyFrameId: 0,
    partySyncFrameId: 0,
    partyObserver: null,
    selectedStickerItem: null,
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const lazyGameScriptPromises = Object.create(null);
  const getSiteBaseUrl = () => {
    const scriptNode =
      document.currentScript || document.querySelector('script[src*="site-terminal.js"]');
    const scriptSrc = scriptNode && scriptNode.src ? scriptNode.src : "";

    if (scriptSrc) {
      try {
        const scriptUrl = new URL(scriptSrc, window.location.href);
        const assetsMarkerIndex = scriptUrl.pathname.lastIndexOf("/assets/");
        if (assetsMarkerIndex !== -1) {
          const basePath = `${scriptUrl.pathname.slice(0, assetsMarkerIndex)}/`;
          return new URL(basePath, scriptUrl.origin);
        }
      } catch {
      }
    }

    return new URL("./", window.location.href);
  };
  const SITE_BASE_URL = getSiteBaseUrl();
  const getAssetUrl = (path) => new URL(String(path || "").replace(/^\/+/, ""), SITE_BASE_URL).href;

  const sanitizePlainText = (value, options = {}) => {
    const multiline = Boolean(options.multiline);
    const maxLength = Number(options.maxLength) || 0;

    let text = String(value ?? "")
      .replace(/\u0000/g, "")
      .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");

    text = multiline ? text.replace(/\r\n?/g, "\n") : text.replace(/[\r\n]+/g, " ");

    if (maxLength > 0 && text.length > maxLength) {
      text = text.slice(0, maxLength);
    }

    return text;
  };

  const getFieldLimit = (field, multiline) => {
    const configured = Number(field.getAttribute("maxlength"));
    if (Number.isFinite(configured) && configured > 0) {
      return configured;
    }

    return multiline ? DEFAULT_MULTI_LINE_LIMIT : DEFAULT_SINGLE_LINE_LIMIT;
  };

  const normalizeTextFieldValue = (field) => {
    const multiline = field.tagName.toLowerCase() === "textarea";
    const safeValue = sanitizePlainText(field.value, {
      multiline,
      maxLength: getFieldLimit(field, multiline),
    });

    if (field.value === safeValue) return;

    const start =
      typeof field.selectionStart === "number" ? field.selectionStart : safeValue.length;
    field.value = safeValue;

    try {
      field.setSelectionRange(
        Math.min(start, safeValue.length),
        Math.min(start, safeValue.length)
      );
    } catch {
    }
  };

  const insertSanitizedText = (field, rawText) => {
    const multiline = field.tagName.toLowerCase() === "textarea";
    const safeText = sanitizePlainText(rawText, {
      multiline,
      maxLength: getFieldLimit(field, multiline),
    });
    const start =
      typeof field.selectionStart === "number" ? field.selectionStart : field.value.length;
    const end = typeof field.selectionEnd === "number" ? field.selectionEnd : start;

    if (typeof field.setRangeText === "function") {
      field.setRangeText(safeText, start, end, "end");
    } else {
      const currentValue = String(field.value || "");
      field.value = `${currentValue.slice(0, start)}${safeText}${currentValue.slice(end)}`;
    }

    field.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const protectTextField = (field) => {
    if (!(field instanceof HTMLElement)) return;
    if (field.dataset.plainTextGuard === "true") return;

    field.dataset.plainTextGuard = "true";
    field.setAttribute("spellcheck", "false");
    field.addEventListener("input", () => normalizeTextFieldValue(field));
    field.addEventListener("change", () => normalizeTextFieldValue(field));
    field.addEventListener("paste", (event) => {
      if (!event.clipboardData) return;
      event.preventDefault();
      insertSanitizedText(field, event.clipboardData.getData("text/plain"));
    });

    normalizeTextFieldValue(field);
  };

  const protectTextFieldsWithin = (root) => {
    if (!(root instanceof Element || root instanceof Document)) return;

    if (root instanceof Element && root.matches(TEXT_FIELD_SELECTOR)) {
      protectTextField(root);
    }

    root.querySelectorAll(TEXT_FIELD_SELECTOR).forEach((field) => {
      protectTextField(field);
    });
  };

  const watchTextFields = () => {
    if (typeof MutationObserver !== "function" || !document.body) return;

    const observer = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          protectTextFieldsWithin(node);
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  };

  const detectSystem = () => {
    const nav = window.navigator || {};
    const uaDataPlatform = String(nav.userAgentData?.platform || "");
    const platform = String(nav.platform || "");
    const userAgent = String(nav.userAgent || "");
    const fingerprint = `${uaDataPlatform} ${platform} ${userAgent}`.toLowerCase();

    if (fingerprint.includes("android")) return "Android phone";
    if (fingerprint.includes("iphone")) return "iPhone from Apple";
    if (
      fingerprint.includes("windows") ||
      fingerprint.includes("win32") ||
      fingerprint.includes("win64")
    ) {
      return "Windows OS";
    }
    if (fingerprint.includes("mac")) return "MacOS";
    if (fingerprint.includes("linux") || fingerprint.includes("x11")) return "Linux";

    return "Unknown system";
  };

  const ensureAudioElement = (id, sourcePath) => {
    if (document.getElementById(id) || !document.body) return;

    const audio = document.createElement("audio");
    audio.id = id;
    audio.preload = "auto";
    audio.src = getAssetUrl(sourcePath);
    document.body.appendChild(audio);
  };

  const ensureBubbleWrapWindow = () => {
    if (!document.body) return;

    if (!document.getElementById("bubbleWrapWindow")) {
      document.body.insertAdjacentHTML(
        "beforeend",
        `
          <section
            class="xp-search-window xp-bubble-wrap-window"
            id="bubbleWrapWindow"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bubbleWrapTitle"
            aria-hidden="true"
            hidden>
            <header class="xp-search-titlebar" data-bubble-wrap-drag-handle>
              <div class="xp-search-title" id="bubbleWrapTitle">Bubble Wrap</div>
              <button
                type="button"
                class="xp-search-close"
                data-bubble-wrap-close
                aria-label="Close bubble wrap game"
                title="Close">
                X
              </button>
            </header>
            <div class="xp-search-body">
              <div class="bubble-wrap-meta" id="bubbleWrapMeta" aria-live="polite"></div>
              <div class="bubble-wrap-board" id="bubbleWrapBoard" role="group" aria-label="Bubble wrap sheet"></div>
              <ul class="bubble-wrap-actions" aria-label="Bubble wrap controls">
                <li>
                  <button
                    type="button"
                    class="bubble-wrap-action icon solid fa-rotate"
                    data-bubble-wrap-restart
                    aria-label="Restart bubble wrap">
                    <span class="label">Restart</span>
                  </button>
                </li>
              </ul>
            </div>
          </section>
        `
      );
    }

    ensureAudioElement("bubbleWrapPopSound", "/images/bubblepopsoundeffect.mp3");
  };

  const ensureMinesweeperWindow = () => {
    if (!document.body) return;

    if (!document.getElementById("minesweeperWindow")) {
      document.body.insertAdjacentHTML(
        "beforeend",
        `
          <section
            class="xp-search-window xp-minesweeper-window"
            id="minesweeperWindow"
            role="dialog"
            aria-modal="true"
            aria-labelledby="minesweeperTitle"
            aria-hidden="true"
            hidden>
            <header class="xp-search-titlebar" data-minesweeper-drag-handle>
              <div class="xp-search-title" id="minesweeperTitle">Minesweeper</div>
              <button
                type="button"
                class="xp-search-close"
                data-minesweeper-close
                aria-label="Close Minesweeper"
                title="Close">
                X
              </button>
            </header>
            <div class="xp-search-body">
              <div class="minesweeper-shell">
                <div class="minesweeper-meta" id="minesweeperMeta" aria-live="polite"></div>
                <div class="minesweeper-statusbar" aria-label="Minesweeper status">
                  <div class="minesweeper-status-pill" id="minesweeperCounter">10 mines left</div>
                  <div class="minesweeper-status-pill" id="minesweeperState" data-state="ready">Ready</div>
                </div>
                <div
                  class="minesweeper-board"
                  id="minesweeperBoard"
                  role="group"
                  aria-label="Minesweeper board"></div>
                <ul
                  class="bubble-wrap-actions minesweeper-actions"
                  id="minesweeperActions"
                  aria-label="Minesweeper controls"
                  hidden>
                  <li>
                    <button
                      type="button"
                      class="bubble-wrap-action icon solid fa-rotate"
                      data-minesweeper-restart
                      aria-label="Restart Minesweeper">
                      <span class="label">Restart</span>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        `
      );
    }

    ensureAudioElement("minesweeperExplosionSound", "/images/MineSweeperSprites/ExplosionSE.mp3");
    ensureAudioElement("minesweeperConfettiSound", "/images/MineSweeperSprites/ConfettiSE.mp3");
  };

  const ensureWindowCommandElements = (config) => {
    if (config.apiName === "bubbleWrap") {
      ensureBubbleWrapWindow();
      return;
    }

    if (config.apiName === "minesweeper") {
      ensureMinesweeperWindow();
    }
  };

  const getGameApi = (apiName) => window.__milancholyGames?.[apiName] || null;

  const loadScriptOnce = (scriptId, scriptPath) => {
    if (lazyGameScriptPromises[scriptId]) {
      return lazyGameScriptPromises[scriptId];
    }

    const selector = `script[${GAME_SCRIPT_ATTRIBUTE}="${scriptId}"]`;
    const existingScript = document.querySelector(selector);
    if (existingScript?.dataset.loaded === "true") {
      return Promise.resolve();
    }

    lazyGameScriptPromises[scriptId] = new Promise((resolve, reject) => {
      const handleLoad = () => {
        scriptNode.dataset.loaded = "true";
        resolve();
      };
      const handleError = () => {
        reject(new Error(`Could not load ${scriptId}.`));
      };

      const scriptNode =
        existingScript ||
        Object.assign(document.createElement("script"), {
          async: true,
          src: getAssetUrl(scriptPath),
        });

      scriptNode.setAttribute(GAME_SCRIPT_ATTRIBUTE, scriptId);
      scriptNode.addEventListener("load", handleLoad, { once: true });
      scriptNode.addEventListener("error", handleError, { once: true });

      if (!existingScript) {
        document.body.appendChild(scriptNode);
      }
    }).catch((error) => {
      delete lazyGameScriptPromises[scriptId];
      throw error;
    });

    return lazyGameScriptPromises[scriptId];
  };

  const ensureWindowCommandReady = async (config) => {
    ensureWindowCommandElements(config);

    const existingApi = getGameApi(config.apiName);
    if (existingApi?.open) {
      return existingApi;
    }

    await loadScriptOnce(config.scriptId, config.scriptPath);
    return getGameApi(config.apiName);
  };

  const schedulePartySync = () => {
    if (!state.partyMode || state.partySyncFrameId) return;

    state.partySyncFrameId = window.requestAnimationFrame(() => {
      state.partySyncFrameId = 0;
      syncPartyNodes();
    });
  };

  const ensurePartyObserver = () => {
    if (state.partyObserver || typeof MutationObserver !== "function" || !document.body) return;

    state.partyObserver = new MutationObserver((records) => {
      const shouldSync = records.some((record) => {
        if (record.type === "childList") {
          return record.addedNodes.length > 0 || record.removedNodes.length > 0;
        }

        return record.type === "attributes";
      });

      if (shouldSync) {
        schedulePartySync();
      }
    });

    state.partyObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["hidden", "class", "style", "aria-hidden"],
    });
  };

  const injectStyles = () => {
    if (document.getElementById(TERMINAL_STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = TERMINAL_STYLE_ID;
    style.textContent = `
      #${TERMINAL_TRIGGER_ID} {
        position: fixed;
        top: 0;
        left: 0;
        width: 2.25rem;
        height: 2.25rem;
        padding: 0;
        margin: 0;
        border: 0;
        background: transparent;
        color: transparent;
        opacity: 0;
        cursor: pointer;
        z-index: 10090;
      }

      #${TERMINAL_TRIGGER_ID}:focus,
      #${TERMINAL_TRIGGER_ID}:focus-visible {
        outline: none;
        box-shadow: none;
      }

      #${TERMINAL_WINDOW_ID} {
        top: 5.25rem;
        left: 1rem;
        width: min(92vw, 30rem);
        min-width: min(92vw, 19rem);
        z-index: 10080;
      }

      #${TERMINAL_WINDOW_ID}.is-dragging .xp-search-titlebar {
        cursor: grabbing;
      }

      .milancholy-terminal-body {
        padding: 0.75rem;
        background:
          radial-gradient(circle at top left, rgba(255, 137, 214, 0.18), transparent 34%),
          radial-gradient(circle at 82% 8%, rgba(175, 114, 255, 0.15), transparent 28%),
          linear-gradient(180deg, rgba(76, 25, 89, 0.94), rgba(43, 13, 69, 0.96) 48%, rgba(28, 8, 49, 0.98));
      }

      .milancholy-terminal-screen {
        position: relative;
        display: grid;
        grid-template-rows: minmax(0, 1fr) auto;
        height: min(52vh, 18rem);
        min-height: 13rem;
        border-radius: 3px;
        border: 1px solid rgba(158, 255, 158, 0.28);
        background:
          radial-gradient(circle at top left, rgba(255, 121, 200, 0.12), transparent 36%),
          radial-gradient(circle at 85% 12%, rgba(153, 97, 255, 0.16), transparent 28%),
          linear-gradient(180deg, rgba(52, 10, 62, 0.98), rgba(28, 6, 47, 0.99) 56%, rgba(17, 4, 30, 0.99));
        box-shadow:
          inset 0 0 0 1px rgba(0, 0, 0, 0.45),
          inset 0 0 1.8rem rgba(68, 182, 68, 0.08);
        overflow: hidden;
      }

      .milancholy-terminal-screen::before {
        content: "";
        position: absolute;
        inset: 0;
        background:
          linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.04) 0,
            rgba(255, 255, 255, 0.04) 1px,
            transparent 1px,
            transparent 3px
          );
        opacity: 0.2;
        pointer-events: none;
      }

      .milancholy-terminal-output {
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
        padding: 0.7rem 0.25rem 0.3rem 0.75rem;
        color: #8fff8f;
        font-family: Consolas, "Courier New", monospace;
        font-size: 0.9rem;
        line-height: 1.45;
        white-space: pre-wrap;
        word-break: break-word;
        text-shadow: 0 0 0.2rem rgba(96, 255, 96, 0.18);
        scrollbar-width: thin;
        scrollbar-color: rgba(133, 255, 133, 0.96) rgba(29, 10, 37, 0.9);
      }

      .milancholy-terminal-output::-webkit-scrollbar {
        width: 0.8rem;
      }

      .milancholy-terminal-output::-webkit-scrollbar-track {
        background:
          linear-gradient(180deg, rgba(79, 28, 91, 0.92), rgba(31, 10, 40, 0.94));
        border-left: 1px solid rgba(127, 255, 127, 0.14);
      }

      .milancholy-terminal-output::-webkit-scrollbar-thumb {
        background:
          linear-gradient(180deg, rgba(197, 255, 197, 0.28), rgba(197, 255, 197, 0.04) 30%),
          linear-gradient(180deg, rgba(112, 255, 112, 0.98), rgba(44, 197, 96, 0.95));
        border: 1px solid rgba(210, 255, 210, 0.28);
        border-radius: 3px;
        box-shadow: inset 0 0 0 1px rgba(8, 48, 20, 0.3);
      }

      .milancholy-terminal-output::-webkit-scrollbar-thumb:hover {
        background:
          linear-gradient(180deg, rgba(218, 255, 218, 0.35), rgba(218, 255, 218, 0.06) 30%),
          linear-gradient(180deg, rgba(138, 255, 138, 1), rgba(61, 213, 112, 0.96));
      }

      .milancholy-terminal-line + .milancholy-terminal-line {
        margin-top: 0.28rem;
      }

      .milancholy-terminal-line.is-system {
        color: #88e7ff;
      }

      .milancholy-terminal-line.is-error {
        color: #ff9595;
      }

      .milancholy-terminal-line.is-command {
        color: #d5ffd5;
      }

      .milancholy-terminal-input-form {
        display: flex;
        align-items: baseline;
        gap: 0;
        flex: 0 0 auto;
        box-sizing: border-box;
        min-height: calc(1.45em + 0.62rem);
        padding: 0 0.75rem 0.62rem;
        font-family: Consolas, "Courier New", monospace;
        font-size: 0.9rem;
        font-weight: 400;
        line-height: 1.45;
        letter-spacing: 0.01em;
        color: #bfffbf;
        text-shadow: 0 0 0.2rem rgba(96, 255, 96, 0.18);
        background: none;
      }

      .milancholy-terminal-prompt,
      .milancholy-terminal-input {
        font: inherit;
        line-height: inherit;
        letter-spacing: inherit;
        text-shadow: inherit;
        color: inherit;
      }

      .milancholy-terminal-prompt {
        display: inline-flex;
        align-items: baseline;
        flex-shrink: 0;
        box-sizing: border-box;
        margin-right: 0;
        padding: 0;
        height: 1.45em;
      }

      .milancholy-terminal-input {
        flex: 1 1 auto;
        display: block;
        min-width: 0;
        padding: 0;
        margin: 0 0 0 -0.04rem;
        border: none !important;
        outline: none !important;
        background: transparent !important;
        background-image: none !important;
        height: 1.45em;
        min-height: 1.45em;
        box-shadow: none !important;
        box-sizing: border-box;
        caret-color: currentColor;
        appearance: none;
        -webkit-appearance: none;
      }

      .milancholy-terminal-input:focus,
      .milancholy-terminal-input:focus-visible {
        outline: none !important;
        box-shadow: none !important;
        border: none !important;
      }

      .milancholy-terminal-input::placeholder {
        color: rgba(201, 255, 201, 0.45);
      }

      #${HELP_WINDOW_ID} {
        top: 6.25rem;
        left: 2.5rem;
        width: min(92vw, 27rem);
        min-width: min(92vw, 18rem);
        z-index: 10085;
      }

      #${HELP_WINDOW_ID}.is-dragging .xp-search-titlebar {
        cursor: grabbing;
      }

      .milancholy-help-body {
        background:
          radial-gradient(circle at top left, rgba(255, 137, 214, 0.16), transparent 34%),
          radial-gradient(circle at 82% 8%, rgba(175, 114, 255, 0.14), transparent 28%),
          linear-gradient(180deg, rgba(76, 25, 89, 0.82), rgba(43, 13, 69, 0.86) 48%, rgba(28, 8, 49, 0.9));
      }

      .milancholy-help-copy {
        margin: 0 0 0.7rem;
        font-size: 0.88rem;
        line-height: 1.45;
        color: rgba(255, 255, 255, 0.9);
      }

      .milancholy-help-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.5rem;
        max-height: calc(4 * 4.1rem + 3 * 0.5rem);
        overflow-y: auto;
        padding-right: 0.15rem;
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 223, 246, 0.95) rgba(56, 19, 77, 0.75);
      }

      .milancholy-help-list::-webkit-scrollbar {
        width: 0.7rem;
      }

      .milancholy-help-list::-webkit-scrollbar-track {
        background: rgba(56, 19, 77, 0.75);
        border-radius: 999px;
      }

      .milancholy-help-list::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, rgba(255, 223, 246, 0.98), rgba(234, 131, 212, 0.95));
        border-radius: 999px;
      }

      .milancholy-help-item {
        min-height: 4.1rem;
        box-sizing: border-box;
        padding: 0.55rem 0.65rem;
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.065);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
      }

      .milancholy-help-command {
        display: block;
        margin: 0 0 0.2rem;
        color: #ffffff;
        font-weight: 700;
        font-size: 0.92rem;
      }

      .milancholy-help-description {
        display: block;
        color: rgba(255, 255, 255, 0.82);
        font-size: 0.84rem;
        line-height: 1.4;
      }

      body.${PHYSICS_CLASS} {
        overflow: hidden !important;
      }

      .${PARTY_NODE_CLASS} {
        --local-hue: calc(var(--milancholy-party-hue) + var(--party-offset, 0deg));
        color: hsl(var(--local-hue) 100% 72%) !important;
        border-color: hsl(var(--local-hue) 100% 60%) !important;
        text-shadow: 0 0 0.4rem hsla(var(--local-hue) 100% 50% / 0.45) !important;
        caret-color: hsl(var(--local-hue) 100% 72%) !important;
        -webkit-text-fill-color: hsl(var(--local-hue) 100% 72%) !important;
      }

      .${PARTY_NODE_CLASS}.${PARTY_SURFACE_CLASS} {
        background-color: hsla(var(--local-hue) 100% 50% / 0.15) !important;
        box-shadow: 0 0 1.1rem hsla(var(--local-hue) 100% 50% / 0.32) !important;
      }

      .${PARTY_NODE_CLASS}.${PARTY_WINDOW_CLASS} {
        border-color: hsla(var(--local-hue) 100% 72% / 0.42) !important;
        background-color: hsla(var(--local-hue) 82% 52% / 0.08) !important;
        box-shadow:
          0 0 1.4rem hsla(var(--local-hue) 100% 52% / 0.22) !important,
          0 18px 45px rgba(0, 0, 0, 0.55) !important;
        filter: saturate(1.08) hue-rotate(calc(var(--milancholy-party-hue) * 0.18)) !important;
      }

      .${PARTY_NODE_CLASS}.${PARTY_WINDOW_CLASS} .xp-search-titlebar {
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.25),
          0 0 0.75rem hsla(var(--local-hue) 100% 55% / 0.2) !important;
      }

      .${PARTY_IMAGE_CLASS} {
        filter: hue-rotate(var(--milancholy-party-hue)) saturate(1.55) !important;
      }

      .${PHYSICS_PLACEHOLDER_CLASS} {
        visibility: hidden !important;
        pointer-events: none !important;
      }

      .${PHYSICS_ITEM_CLASS} {
        position: fixed !important;
        left: 0 !important;
        top: 0 !important;
        margin: 0 !important;
        cursor: grab !important;
        touch-action: none !important;
        user-select: none !important;
        will-change: transform !important;
        transition: none !important;
      }

      .${PHYSICS_ITEM_CLASS} * {
        pointer-events: none !important;
        user-select: none !important;
      }

      .${PHYSICS_ITEM_CLASS}.is-dragging {
        cursor: grabbing !important;
      }

      .${PHYSICS_ITEM_CLASS}.is-sticker-selected {
        outline: 2px solid rgba(255, 221, 244, 0.98) !important;
        outline-offset: 3px !important;
        box-shadow:
          0 0 0 1px rgba(197, 86, 167, 0.95) !important,
          0 0 1rem rgba(255, 170, 229, 0.45) !important;
      }

      #${STICKER_ROTATE_BUTTON_ID} {
        position: fixed;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        z-index: 10005;
      }

      #${STICKER_ROTATE_BUTTON_ID}[hidden] {
        display: none !important;
      }

      #${STICKER_ROTATE_BUTTON_ID}.bubble-wrap-action {
        width: 3rem;
        height: 3rem;
        border-radius: 25px;
      }

      @media (max-width: 640px) {
        #${TERMINAL_WINDOW_ID} {
          width: min(calc(100vw - 1rem), 28rem);
          top: 4.6rem;
          left: 0.5rem;
        }

        .milancholy-terminal-output {
          padding-bottom: 0.25rem;
        }

        .milancholy-terminal-input-form {
          padding: 0 0.65rem 0.5rem;
        }

        .milancholy-terminal-prompt,
        .milancholy-terminal-input {
          font-size: 0.76rem;
        }
      }
    `;

    document.head.appendChild(style);
  };

  const createLine = (text, type) => {
    const line = document.createElement("div");
    line.className = "milancholy-terminal-line";
    if (type) {
      line.classList.add(`is-${type}`);
    }
    line.textContent = text;
    return line;
  };

  const appendLine = (outputNode, text, type) => {
    outputNode.appendChild(createLine(text, type));
    outputNode.scrollTop = outputNode.scrollHeight;
  };

  const setWindowPosition = (windowNode, left, top) => {
    const rect = windowNode.getBoundingClientRect();
    const maxLeft = Math.max(WINDOW_MARGIN, window.innerWidth - rect.width - WINDOW_MARGIN);
    const maxTop = Math.max(WINDOW_MARGIN, window.innerHeight - rect.height - WINDOW_MARGIN);

    windowNode.style.left = `${Math.round(clamp(left, WINDOW_MARGIN, maxLeft))}px`;
    windowNode.style.top = `${Math.round(clamp(top, WINDOW_MARGIN, maxTop))}px`;
  };

  const isProtectedUiTarget = (target) => {
    if (!(target instanceof Element)) return false;
    return Boolean(
      target.closest(`#${STICKER_ROTATE_BUTTON_ID}`) ||
      target.closest(".xp-search-window") ||
      target.closest(`#${TERMINAL_WINDOW_ID}`) ||
        target.closest(`#${TERMINAL_TRIGGER_ID}`) ||
        target.closest(`#${HELP_WINDOW_ID}`)
    );
  };

  const hasDirectText = (node) =>
    Array.from(node.childNodes).some(
      (child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim() !== ""
    );

  const isTransparentColor = (value) => {
    const normalized = String(value || "").trim().toLowerCase();
    return (
      normalized === "" ||
      normalized === "transparent" ||
      normalized === "rgba(0, 0, 0, 0)" ||
      normalized === "hsla(0, 0%, 0%, 0)"
    );
  };

  const isHeaderContentNode = (node) => node.matches(HEADER_CONTENT_SELECTOR);
  const isDetachedHeaderTextNode = (node) => node.matches(DETACHED_HEADER_TEXT_SELECTOR);
  const isImageWrapperNode = (node) => node.matches(IMAGE_WRAPPER_SELECTOR);
  const isImagePhysicsNode = (node) =>
    isImageWrapperNode(node) || node.tagName.toLowerCase() === "img";
  const isPartyWindowNode = (node) =>
    node.matches(`.xp-search-window, #${STICKER_ROTATE_BUTTON_ID}`);
  const isTextualPhysicsNode = (node) =>
    node.matches(
      [
        DETACHED_HEADER_TEXT_SELECTOR,
        "#main h1",
        "#main h2",
        "#main h3",
        "#main h4",
        "#main h5",
        "#main h6",
        "#main p",
        "#main li",
        "#main a",
        "#footer p",
      ].join(", ")
    );
  const isPartySurfaceNode = (node) =>
    node.matches(
      [
        ".site-corner-tool",
        "#header nav ul li",
        "#main blockquote",
        "#main .button",
        "#main button",
      ].join(", ")
    );
  const getVisualContentRect = (node) => {
    if (!(node instanceof HTMLElement)) return node.getBoundingClientRect();

    const rect = node.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return rect;
    if (!isTextualPhysicsNode(node)) return rect;

    try {
      const range = document.createRange();
      range.selectNodeContents(node);
      const contentRect = range.getBoundingClientRect();
      range.detach?.();

      if (contentRect.width >= 8 && contentRect.height >= 8) {
        return contentRect;
      }
    } catch {
    }

    return rect;
  };
  const getDetachedHeaderNodes = (node) => {
    if (!isHeaderContentNode(node)) return [];

    return [node.querySelector(`:scope .inner > h1`), node.querySelector(`:scope .inner > p`)].filter(
      (child) => child instanceof HTMLElement
    );
  };

  const matchesPreferredPhysicsNode = (node) => node.matches(PREFERRED_PHYSICS_SELECTORS);

  const shouldSelectPhysicsNode = (node, computedStyle) => {
    if (matchesPreferredPhysicsNode(node)) return true;

    const tagName = node.tagName.toLowerCase();
    const directText = hasDirectText(node);
    if (ATOMIC_TAGS.has(tagName)) return true;
    if (directText) return true;

    const hasDecoration =
      !isTransparentColor(computedStyle.backgroundColor) ||
      parseFloat(computedStyle.borderTopWidth) > 0 ||
      parseFloat(computedStyle.borderRightWidth) > 0 ||
      parseFloat(computedStyle.borderBottomWidth) > 0 ||
      parseFloat(computedStyle.borderLeftWidth) > 0;

    return hasDecoration && node.children.length === 0;
  };

  const isVisiblePhysicsCandidate = (node) => {
    if (!(node instanceof HTMLElement)) return false;
    if (node.id === "bg") return false;
    if (node.id === TERMINAL_TRIGGER_ID || node.id === TERMINAL_WINDOW_ID) return false;
    if (node.closest(`#${TERMINAL_WINDOW_ID}`) || node.closest(`#${TERMINAL_TRIGGER_ID}`)) {
      return false;
    }
    if (SKIP_TAGS.has(node.tagName.toLowerCase())) return false;

    const computed = window.getComputedStyle(node);
    if (
      computed.display === "none" ||
      computed.display === "contents" ||
      computed.visibility === "hidden" ||
      Number(computed.opacity) === 0
    ) {
      return false;
    }

    const rect = node.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return false;
    if (rect.bottom < 0 || rect.right < 0) return false;
    if (rect.left > window.innerWidth || rect.top > window.innerHeight) return false;

    return true;
  };

  const collectPhysicsNodes = (root) => {
    const nodes = [];
    const seen = new Set();

    const pushNode = (node) => {
      if (!(node instanceof HTMLElement)) return false;
      if (seen.has(node)) return false;
      seen.add(node);
      nodes.push(node);
      return true;
    };

    const walk = (node) => {
      if (!(node instanceof HTMLElement)) return;
      if (nodes.length >= MAX_PHYSICS_ITEMS) return;
      if (!isVisiblePhysicsCandidate(node)) return;

      const computed = window.getComputedStyle(node);
      if (shouldSelectPhysicsNode(node, computed)) {
        if (!pushNode(node)) return;

        if (isHeaderContentNode(node)) {
          getDetachedHeaderNodes(node).forEach(walk);
        }

        return;
      }

      Array.from(node.children).forEach(walk);
    };

    Array.from(root.children).forEach(walk);
    return nodes;
  };

  const createPlaceholder = (node, rect, computed) => {
    if (computed.position === "fixed" || computed.position === "absolute") {
      return null;
    }

    const placeholder = document.createElement(
      computed.display === "inline" || computed.display.startsWith("inline-") ? "span" : "div"
    );
    placeholder.className = PHYSICS_PLACEHOLDER_CLASS;
    placeholder.setAttribute("aria-hidden", "true");

    const display =
      computed.display === "inline"
        ? "inline-block"
        : computed.display === "list-item"
          ? "block"
          : computed.display === "contents"
            ? "block"
            : computed.display;

    placeholder.style.display = display;
    placeholder.style.width = `${rect.width}px`;
    placeholder.style.height = `${rect.height}px`;
    placeholder.style.marginTop = computed.marginTop;
    placeholder.style.marginRight = computed.marginRight;
    placeholder.style.marginBottom = computed.marginBottom;
    placeholder.style.marginLeft = computed.marginLeft;
    placeholder.style.flex = computed.flex;
    placeholder.style.alignSelf = computed.alignSelf;
    placeholder.style.justifySelf = computed.justifySelf;
    placeholder.style.verticalAlign = computed.verticalAlign;
    placeholder.style.gridColumn = computed.gridColumn;
    placeholder.style.gridRow = computed.gridRow;

    node.after(placeholder);
    return placeholder;
  };

  const preparePhysicsNodeAppearance = (node) => {
    const computed = window.getComputedStyle(node);

    if (isHeaderContentNode(node)) {
      node.style.color = "transparent";
      node.style.textShadow = "none";
      node.style.webkitTextFillColor = "transparent";
      return;
    }

    if (isDetachedHeaderTextNode(node) || node.dataset.isDetachedTextClone === "true") {
      node.style.color = computed.color;
      node.style.textShadow = computed.textShadow;
      node.style.webkitTextFillColor = computed.color;
      node.style.background = "transparent";
      return;
    }

    if (isImageWrapperNode(node)) {
      node.style.display = "block";
      node.style.boxSizing = "border-box";
      node.style.overflow = "hidden";
      node.style.pointerEvents = "auto";

      const imageNode = node.querySelector(":scope > img");
      if (imageNode instanceof HTMLElement) {
        imageNode.style.display = "block";
        imageNode.style.width = "100%";
        imageNode.style.height = "100%";
        imageNode.style.maxWidth = "100%";
        imageNode.style.objectFit = "cover";
        imageNode.style.pointerEvents = "none";
      }
      return;
    }

    if (node.tagName.toLowerCase() === "img") {
      node.style.display = "block";
      node.style.boxSizing = "border-box";
      node.style.pointerEvents = "auto";
      node.style.objectFit = "contain";
      node.style.objectPosition = "center";
      return;
    }

    if (!node.matches("#header nav ul li")) return;

    const navList = node.parentElement;
    const navStyle = navList ? window.getComputedStyle(navList) : computed;
    const borderWidth = navStyle.borderTopWidth || "1px";
    const borderColor = navStyle.borderTopColor || "rgba(255, 255, 255, 0.9)";

    node.style.boxSizing = "border-box";
    node.style.border = `${borderWidth} solid ${borderColor}`;
    node.style.borderRadius = "4px";
    node.style.backgroundClip = "padding-box";
    node.style.backgroundColor = "rgba(255, 255, 255, 0.04)";
    node.style.display = "block";
    node.style.listStyle = "none";
    node.style.overflow = "hidden";

    if (navList instanceof HTMLElement) {
      navList.style.borderColor = "transparent";
      navList.style.background = "transparent";
    }
  };

  const ensureHelpWindow = () => {
    if (!document.body) return null;

    const existing = document.getElementById(HELP_WINDOW_ID);
    if (existing instanceof HTMLElement) {
      return {
        node: existing,
        open: () => {
          existing.hidden = false;
          existing.setAttribute("aria-hidden", "false");
          requestAnimationFrame(() => {
            const rect = existing.getBoundingClientRect();
            setWindowPosition(existing, rect.left, rect.top);
          });
          schedulePartySync();
        },
        close: () => {
          existing.hidden = true;
          existing.setAttribute("aria-hidden", "true");
          schedulePartySync();
        },
      };
    }

    const windowNode = document.createElement("section");
    windowNode.id = HELP_WINDOW_ID;
    windowNode.className = "xp-search-window milancholy-help-window";
    windowNode.setAttribute("role", "dialog");
    windowNode.setAttribute("aria-modal", "false");
    windowNode.setAttribute("aria-labelledby", "milancholyHelpTitle");
    windowNode.setAttribute("aria-hidden", "true");
    windowNode.hidden = true;

    const titlebar = document.createElement("header");
    titlebar.className = "xp-search-titlebar";

    const title = document.createElement("div");
    title.className = "xp-search-title";
    title.id = "milancholyHelpTitle";
    title.textContent = "Help";

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "xp-search-close";
    closeButton.setAttribute("aria-label", "Close help");
    closeButton.title = "Close";
    closeButton.textContent = "X";

    const body = document.createElement("div");
    body.className = "xp-search-body milancholy-help-body";

    const copy = document.createElement("p");
    copy.className = "milancholy-help-copy";
    copy.textContent = "Available terminal commands:";

    const list = document.createElement("ul");
    list.className = "milancholy-help-list";
    list.setAttribute("aria-label", "Available terminal commands");

    COMMAND_HELP.forEach((command) => {
      const item = document.createElement("li");
      item.className = "milancholy-help-item";

      const name = document.createElement("strong");
      name.className = "milancholy-help-command";
      name.textContent = command.name;

      const description = document.createElement("span");
      description.className = "milancholy-help-description";
      description.textContent = command.description;

      item.appendChild(name);
      item.appendChild(description);
      list.appendChild(item);
    });

    body.appendChild(copy);
    body.appendChild(list);
    titlebar.appendChild(title);
    titlebar.appendChild(closeButton);
    windowNode.appendChild(titlebar);
    windowNode.appendChild(body);
    document.body.appendChild(windowNode);

    const stopPropagation = (event) => {
      event.stopPropagation();
    };

    const open = () => {
      windowNode.hidden = false;
      windowNode.setAttribute("aria-hidden", "false");
      requestAnimationFrame(() => {
        const rect = windowNode.getBoundingClientRect();
        setWindowPosition(windowNode, rect.left, rect.top);
      });
      schedulePartySync();
    };

    const close = () => {
      windowNode.hidden = true;
      windowNode.setAttribute("aria-hidden", "true");
      schedulePartySync();
    };

    windowNode.addEventListener("pointerdown", stopPropagation);
    windowNode.addEventListener("click", stopPropagation);
    closeButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      close();
    });

    let draggingWindow = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragOriginLeft = 0;
    let dragOriginTop = 0;

    titlebar.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      if (event.target.closest("button, input, a, label")) return;
      if (windowNode.hidden) return;

      draggingWindow = true;
      dragStartX = event.clientX;
      dragStartY = event.clientY;

      const rect = windowNode.getBoundingClientRect();
      dragOriginLeft = rect.left;
      dragOriginTop = rect.top;
      windowNode.classList.add("is-dragging");

      try {
        titlebar.setPointerCapture(event.pointerId);
      } catch {
      }

      event.preventDefault();
      event.stopPropagation();
    });

    titlebar.addEventListener("pointermove", (event) => {
      if (!draggingWindow) return;

      const nextLeft = dragOriginLeft + (event.clientX - dragStartX);
      const nextTop = dragOriginTop + (event.clientY - dragStartY);
      setWindowPosition(windowNode, nextLeft, nextTop);
      event.preventDefault();
    });

    const endWindowDrag = () => {
      draggingWindow = false;
      windowNode.classList.remove("is-dragging");
    };

    titlebar.addEventListener("pointerup", endWindowDrag);
    titlebar.addEventListener("pointercancel", endWindowDrag);
    titlebar.addEventListener("lostpointercapture", endWindowDrag);

    return { node: windowNode, open, close };
  };

  const openHelpWindow = (outputNode) => {
    const helpWindow = ensureHelpWindow();
    if (!helpWindow) {
      appendLine(outputNode, "Could not open Help.", "error");
      return;
    }

    helpWindow.open();
    appendLine(outputNode, "Opening Help...", "system");
  };

  const getStickerRotateButton = () => {
    if (!document.body) return null;

    const existing = document.getElementById(STICKER_ROTATE_BUTTON_ID);
    if (existing instanceof HTMLButtonElement) return existing;

    const button = document.createElement("button");
    button.type = "button";
    button.id = STICKER_ROTATE_BUTTON_ID;
    button.className = "bubble-wrap-action icon solid fa-rotate";
    button.hidden = true;
    button.setAttribute("aria-label", "Rotate selected sticker");
    button.title = "Rotate";
    document.body.appendChild(button);
    return button;
  };

  const clearStickerSelection = () => {
    if (state.selectedStickerItem?.node instanceof HTMLElement) {
      state.selectedStickerItem.node.classList.remove("is-sticker-selected");
    }

    state.selectedStickerItem = null;

    const rotateButton = getStickerRotateButton();
    if (rotateButton) {
      rotateButton.hidden = true;
    }

    if (state.partyMode) {
      syncPartyNodes();
    }
  };

  const updateStickerSelectionUi = () => {
    const selected = state.selectedStickerItem;
    const rotateButton = getStickerRotateButton();

    if (
      !rotateButton ||
      state.physicsMode !== "stickers" ||
      !selected ||
      !(selected.node instanceof HTMLElement) ||
      !document.body.contains(selected.node)
    ) {
      if (rotateButton) rotateButton.hidden = true;
      return;
    }

    selected.node.classList.add("is-sticker-selected");

    const bounds = getItemWorldBounds(selected);
    const buttonSize = 3 * 16;
    const gap = 12;
    const left = clamp(
      bounds.minX + (bounds.maxX - bounds.minX) / 2 - buttonSize / 2,
      WINDOW_MARGIN,
      Math.max(WINDOW_MARGIN, window.innerWidth - buttonSize - WINDOW_MARGIN)
    );
    const top = clamp(
      bounds.minY - buttonSize - gap,
      WINDOW_MARGIN,
      Math.max(WINDOW_MARGIN, window.innerHeight - buttonSize - WINDOW_MARGIN)
    );

    rotateButton.hidden = false;
    rotateButton.style.left = `${Math.round(left)}px`;
    rotateButton.style.top = `${Math.round(top)}px`;

    if (state.partyMode) {
      syncPartyNodes();
    }
  };

  const setSelectedStickerItem = (item) => {
    if (state.selectedStickerItem === item) {
      updateStickerSelectionUi();
      return;
    }

    if (state.selectedStickerItem?.node instanceof HTMLElement) {
      state.selectedStickerItem.node.classList.remove("is-sticker-selected");
    }

    state.selectedStickerItem = item;
    if (item?.node instanceof HTMLElement) {
      item.node.classList.add("is-sticker-selected");
      bringItemToFront(item);
    }

    updateStickerSelectionUi();
  };

  const installStickerRotateControl = () => {
    const rotateButton = getStickerRotateButton();
    if (!rotateButton || rotateButton.dataset.bound === "true") return;

    rotateButton.dataset.bound = "true";
    rotateButton.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    rotateButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const selected = state.selectedStickerItem;
      if (!selected || state.physicsMode !== "stickers") return;

      selected.rotation = (selected.rotation + 15) % 360;
      clampItemToViewport(selected);
      applyItemTransform(selected);
      setSelectedStickerItem(selected);
    });
  };

  const installStickerOutsideClickClear = () => {
    if (document.body?.dataset.stickerOutsideClearBound === "true") return;
    if (!document.body) return;

    document.body.dataset.stickerOutsideClearBound = "true";
    document.addEventListener(
      "pointerdown",
      (event) => {
        if (state.physicsMode !== "stickers" || !state.selectedStickerItem) return;
        if (!(event.target instanceof Element)) return;
        if (event.target.closest(`.${PHYSICS_ITEM_CLASS}`)) return;
        if (event.target.closest(`#${STICKER_ROTATE_BUTTON_ID}`)) return;
        clearStickerSelection();
      },
      true
    );
  };

  const applyItemTransform = (item) => {
    item.node.style.transform = `translate3d(${item.x}px, ${item.y}px, 0) rotate(${item.rotation}deg)`;
    if (state.selectedStickerItem === item) {
      updateStickerSelectionUi();
    }
  };

  const getItemLocalBounds = (item, rotation = item.rotation) => {
    const radians = (rotation * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const corners = [
      { x: 0, y: 0 },
      { x: item.width * cos, y: item.width * sin },
      { x: -item.height * sin, y: item.height * cos },
      {
        x: item.width * cos - item.height * sin,
        y: item.width * sin + item.height * cos,
      },
    ];

    const xs = corners.map((corner) => corner.x);
    const ys = corners.map((corner) => corner.y);

    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    };
  };

  const getItemWorldBounds = (item) => {
    const local = getItemLocalBounds(item);
    return {
      minX: item.x + local.minX,
      maxX: item.x + local.maxX,
      minY: item.y + local.minY,
      maxY: item.y + local.maxY,
    };
  };

  const clampItemToViewport = (item) => {
    const local = getItemLocalBounds(item);
    const minX = -local.minX;
    const maxX = window.innerWidth - local.maxX;
    const minY = -local.minY;
    const maxY = window.innerHeight - local.maxY;

    item.x = clamp(item.x, Math.min(minX, maxX), Math.max(minX, maxX));
    item.y = clamp(item.y, Math.min(minY, maxY), Math.max(minY, maxY));
  };

  const recordDragSample = (item, x, y, timeStamp) => {
    item.dragSamples.push({ x, y, timeStamp });

    while (
      item.dragSamples.length > 3 &&
      timeStamp - item.dragSamples[0].timeStamp > 120
    ) {
      item.dragSamples.shift();
    }
  };

  const getReleaseVelocity = (item) => {
    if (item.dragSamples.length < 2) {
      return { vx: 0, vy: 0 };
    }

    const first = item.dragSamples[0];
    const last = item.dragSamples[item.dragSamples.length - 1];
    const elapsed = Math.max((last.timeStamp - first.timeStamp) / 1000, 0.016);
    return {
      vx: clamp((last.x - first.x) / elapsed, -MAX_RELEASE_SPEED, MAX_RELEASE_SPEED),
      vy: clamp((last.y - first.y) / elapsed, -MAX_RELEASE_SPEED, MAX_RELEASE_SPEED),
    };
  };

  const bringItemToFront = (item) => {
    item.node.style.zIndex = String(9000 + item.index);
  };

  const resetItemZIndex = (item) => {
    item.node.style.zIndex = String(item.baseZIndex);
  };

  const getPhysicsActionTarget = (item) => {
    if (!item?.node || !(item.node instanceof HTMLElement)) return null;

    const directMatchers = [
      "a[href]",
      "button",
      "input",
      "textarea",
      "select",
      "summary",
      "label[for]",
      "[role=\"button\"]",
      "[data-site-search-open]",
      "[data-site-search-close]",
      "[data-bubble-wrap-close]",
      "[data-bubble-wrap-restart]",
      "[data-minesweeper-close]",
      "[data-minesweeper-restart]",
    ];

    if (item.node.matches(directMatchers.join(", "))) {
      return item.node;
    }

    return item.node.querySelector(directMatchers.join(", "));
  };

  const triggerPhysicsItemAction = (item) => {
    const target = getPhysicsActionTarget(item);
    if (!(target instanceof HTMLElement)) return false;

    state.allowProgrammaticUiEvent = true;

    try {
      target.click();
      return true;
    } catch {
      return false;
    } finally {
      window.setTimeout(() => {
        state.allowProgrammaticUiEvent = false;
      }, 0);
    }
  };

  const attachPhysicsInteractions = (item) => {
    const startDrag = (event) => {
      if (!state.physicsMode || event.button !== 0) return;

      event.preventDefault();
      event.stopPropagation();

      state.activeDrag = item;
      item.dragging = true;
      item.pointerId = event.pointerId;
      item.dragOffsetX = event.clientX - item.x;
      item.dragOffsetY = event.clientY - item.y;
      item.vx = 0;
      item.vy = 0;
      item.angularVelocity = 0;
      item.dragSamples.length = 0;
      item.node.classList.add("is-dragging");
      bringItemToFront(item);
      recordDragSample(item, event.clientX, event.clientY, event.timeStamp || performance.now());

      try {
        item.node.setPointerCapture(event.pointerId);
      } catch {
      }
    };

    const moveDrag = (event) => {
      if (!item.dragging || item.pointerId !== event.pointerId) return;

      event.preventDefault();
      event.stopPropagation();

      item.x = event.clientX - item.dragOffsetX;
      item.y = event.clientY - item.dragOffsetY;
      if (state.physicsMode !== "stickers") {
        item.rotation += (event.movementX || 0) * 0.08;
      }
      clampItemToViewport(item);

      recordDragSample(item, event.clientX, event.clientY, event.timeStamp || performance.now());
      applyItemTransform(item);
    };

    const endDrag = (event) => {
      if (!item.dragging) return;
      if (event.pointerId != null && item.pointerId != null && item.pointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const mode = PHYSICS_MODES[state.physicsMode] || PHYSICS_MODES.gravity;
      const release = getReleaseVelocity(item);

      item.dragging = false;
      item.pointerId = null;
      item.vx = mode.releaseInertia === false ? 0 : release.vx;
      item.vy = mode.releaseInertia === false ? 0 : release.vy;
      item.angularVelocity = mode.releaseInertia === false ? 0 : release.vx * mode.spinScale;
      item.dragSamples.length = 0;
      item.node.classList.remove("is-dragging");
      resetItemZIndex(item);

      if (state.activeDrag === item) {
        state.activeDrag = null;
      }
    };

    item.node.addEventListener("pointerdown", startDrag);
    item.node.addEventListener("pointermove", moveDrag);
    item.node.addEventListener("pointerup", endDrag);
    item.node.addEventListener("pointercancel", endDrag);
    item.node.addEventListener("lostpointercapture", endDrag);
    item.node.addEventListener("click", (event) => {
      if (!state.physicsMode) return;
      if (state.physicsMode === "stickers") {
        setSelectedStickerItem(item);
      }
      event.preventDefault();
      event.stopPropagation();
    });
    item.node.addEventListener("contextmenu", (event) => {
      if (!state.physicsMode) return;

      if (triggerPhysicsItemAction(item)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    });
  };

  const buildPhysicsItems = () => {
    if (state.physicsItems.length) return state.physicsItems;

    const root = document.body;
    const nodes = collectPhysicsNodes(root);
    const items = [];

    nodes.forEach((node, index) => {
      const isDetachedText = isDetachedHeaderTextNode(node);
      const computed = window.getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      const visualRect = getVisualContentRect(node);

      let targetNode = node;
      let placeholder = null;

      if (isDetachedText) {
        // Clone the text element to create a separate entity.
        targetNode = node.cloneNode(true);

        // Copy styles that define the text appearance.
        targetNode.style.color = computed.color;
        targetNode.style.font = computed.font;
        targetNode.style.textAlign = computed.textAlign;
        targetNode.style.textTransform = computed.textTransform;
        targetNode.style.letterSpacing = computed.letterSpacing;
        targetNode.style.lineHeight = computed.lineHeight;
        targetNode.style.textShadow = computed.textShadow;
        targetNode.style.webkitTextFillColor = computed.color;
        targetNode.dataset.isDetachedTextClone = "true";

        if (node.matches(HEADER_SUBTITLE_SELECTOR)) {
          targetNode.dataset.isSubtitleClone = "true";
        }

        document.body.appendChild(targetNode);

        // Hide the original text element but keep it in the layout.
        node.style.visibility = "hidden";
      } else {
        placeholder = createPlaceholder(node, rect, computed);
      }

      const isImageLikeNode = isImagePhysicsNode(targetNode);
      let width = isImageLikeNode ? rect.width : visualRect.width;
      let height = isImageLikeNode ? rect.height : visualRect.height;
      let x = isImageLikeNode ? rect.left : visualRect.left;
      let y = isImageLikeNode ? rect.top : visualRect.top;

      if (isImageLikeNode) {
        const maxWidth = Math.max(120, window.innerWidth - WINDOW_MARGIN * 2);
        const maxHeight = Math.max(120, window.innerHeight - WINDOW_MARGIN * 2);
        const scale = Math.min(maxWidth / width, maxHeight / height, 1);

        if (Number.isFinite(scale) && scale > 0 && scale < 1) {
          width = Math.round(width * scale);
          height = Math.round(height * scale);
          if (targetNode.tagName.toLowerCase() === "img") {
            targetNode.style.objectFit = "contain";
          }
        }
      }

      targetNode.classList.add(PHYSICS_ITEM_CLASS);
      targetNode.style.position = "fixed";
      targetNode.style.left = "0px";
      targetNode.style.top = "0px";
      targetNode.style.width = `${width}px`;
      targetNode.style.height = `${height}px`;
      targetNode.style.margin = "0";
      targetNode.style.maxWidth = "none";
      targetNode.style.transformOrigin = "top left";
      preparePhysicsNodeAppearance(targetNode);

      if (computed.display === "inline") {
        targetNode.style.display = "inline-block";
      } else if (computed.display === "contents") {
        targetNode.style.display = "block";
      }

      const item = {
        node: targetNode,
        placeholder,
        width,
        height,
        x,
        y,
        vx: 0,
        vy: 0,
        rotation: 0,
        angularVelocity: 0,
        floatPhase: Math.random() * Math.PI * 2,
        dragging: false,
        pointerId: null,
        dragOffsetX: 0,
        dragOffsetY: 0,
        dragSamples: [],
        baseZIndex: 6000 + index,
        index,
      };

      targetNode.style.zIndex = String(item.baseZIndex);
      clampItemToViewport(item);
      applyItemTransform(item);
      attachPhysicsInteractions(item);
      items.push(item);
    });

    if (items.length) {
      document.body.classList.add(PHYSICS_CLASS);
      document.body.style.minHeight = `${Math.max(document.body.scrollHeight, window.innerHeight)}px`;

      if (state.partyMode) {
        syncPartyNodes();
      }
    }

    state.physicsItems = items;
    return items;
  };

  const kickItemsForMode = (modeName, isInitialActivation) => {
    const mode = PHYSICS_MODES[modeName];
    state.physicsItems.forEach((item) => {
      if (item.dragging) return;

      if (modeName === "stickers") {
        item.vx = 0;
        item.vy = 0;
        item.angularVelocity = 0;
        clampItemToViewport(item);
        applyItemTransform(item);
        return;
      }

      const isDetachedHeaderText =
        item.node instanceof Element && isDetachedHeaderTextNode(item.node);
      const isHeaderContent = item.node instanceof Element && isHeaderContentNode(item.node);
      const baseKickX = mode.initialKickX * (isHeaderContent ? 0.34 : 1);
      const baseKickY = mode.initialKickY * (isHeaderContent ? 0.34 : 1);

      if (isInitialActivation) {
        item.vx += (Math.random() * 2 - 1) * baseKickX;
        item.vy += Math.random() * baseKickY;
        if (isDetachedHeaderText) {
          const maxX = Math.max(0, window.innerWidth - item.width);
          const maxY = Math.max(0, window.innerHeight - item.height);
          item.x = clamp(item.x + (Math.random() * 2 - 1) * Math.max(16, item.width * 0.08), 0, maxX);
          item.y = clamp(item.y - Math.max(8, item.height * 0.05), 0, maxY);
          item.vx += (Math.random() * 2 - 1) * mode.initialKickX * 0.92;
          item.vy += Math.max(58, mode.initialKickY * 0.68);
          item.angularVelocity += (Math.random() * 2 - 1) * 2.2;
          applyItemTransform(item);
        }
      } else if (modeName === "space") {
        item.vx *= 0.42;
        item.vy *= 0.38;
        item.vx += (Math.random() * 2 - 1) * 18;
        item.vy += Math.random() * 8;
        if (isDetachedHeaderText) {
          item.vx += (Math.random() * 2 - 1) * 12;
          item.vy += 4;
        }
      } else {
        item.vx *= 1.06;
        item.vy *= 1.12;
        item.vy += 140;
        if (isDetachedHeaderText) {
          item.vx += (Math.random() * 2 - 1) * 52;
          item.vy += 72;
        }
      }
    });
  };

  const clearPartyDecor = (node) => {
    if (!(node instanceof HTMLElement)) return;
    node.classList.remove(
      PARTY_NODE_CLASS,
      PARTY_IMAGE_CLASS,
      PARTY_SURFACE_CLASS,
      PARTY_WINDOW_CLASS
    );
    node.style.removeProperty("--party-offset");
  };

  const decoratePartyNode = (node, index = 0) => {
    if (!(node instanceof HTMLElement)) return;

    node.classList.add(PARTY_NODE_CLASS);
    node.style.setProperty("--party-offset", `${index * 15}deg`);

    if (isImagePhysicsNode(node)) {
      node.classList.add(PARTY_IMAGE_CLASS);
    }

    if (isPartySurfaceNode(node)) {
      node.classList.add(PARTY_SURFACE_CLASS);
    }

    if (isPartyWindowNode(node)) {
      node.classList.add(PARTY_WINDOW_CLASS);
    }
  };

  const collectPartyNodes = () => {
    const seen = new Set();

    return Array.from(document.querySelectorAll(PARTY_TARGET_SELECTORS)).filter((node) => {
      if (!(node instanceof HTMLElement)) return false;
      if (seen.has(node)) return false;
      seen.add(node);

      if (node.id === "bg") return false;
      if (node.id === TERMINAL_TRIGGER_ID) return false;
      if (node.closest(`#${TERMINAL_TRIGGER_ID}`)) {
        return false;
      }

      const computed = window.getComputedStyle(node);
      if (
        computed.display === "none" ||
        computed.visibility === "hidden" ||
        Number(computed.opacity) === 0
      ) {
        return false;
      }

      const rect = node.getBoundingClientRect();
      return rect.width >= 8 && rect.height >= 8;
    });
  };

  const syncPartyNodes = () => {
    const nextNodes = collectPartyNodes();
    const nextSet = new Set(nextNodes);

    state.partyNodes.forEach((node) => {
      if (!nextSet.has(node)) {
        clearPartyDecor(node);
      }
    });

    nextNodes.forEach((node, index) => decoratePartyNode(node, index));
    state.partyNodes = nextNodes;
    return nextNodes;
  };

  const stepParty = (timeStamp) => {
    if (!state.partyMode) {
      state.partyFrameId = 0;
      return;
    }

    const hue = (timeStamp * 0.1) % 360;
    document.documentElement.style.setProperty("--milancholy-party-hue", `${hue}deg`);
    state.partyFrameId = window.requestAnimationFrame(stepParty);
  };

  const startPartyLoop = () => {
    if (state.partyFrameId) return;
    state.partyFrameId = window.requestAnimationFrame(stepParty);
  };

  const setPartyMode = (outputNode) => {
    const nodes = syncPartyNodes();

    if (!nodes.length) {
      appendLine(outputNode, "No visible party-ready items were found.", "error");
      return;
    }

    if (state.partyMode) {
      appendLine(outputNode, "Party mode is already running.", "system");
      return;
    }

    state.partyMode = true;
    document.body.classList.add(PARTY_CLASS);

    const subtitle = document.querySelector(HEADER_SUBTITLE_SELECTOR);
    if (subtitle) {
      subtitle.textContent = "AKA: Mila's website:3";
    }

    // Also update any subtitle clones if physics is active
    document.querySelectorAll('[data-is-subtitle-clone="true"]').forEach((clone) => {
      clone.textContent = "AKA: Mila's website:3";
    });

    ensurePartyObserver();
    startPartyLoop();
    appendLine(outputNode, "Let's Party!!!", "system");
  };

  const stepPhysics = (timeStamp) => {
    if (!state.physicsMode) {
      state.physicsFrameId = 0;
      return;
    }

    if (!state.physicsLastTime) {
      state.physicsLastTime = timeStamp;
    }

    const mode = PHYSICS_MODES[state.physicsMode];
    const deltaSeconds = Math.min((timeStamp - state.physicsLastTime) / 1000, 1 / 30);
    state.physicsLastTime = timeStamp;

    state.physicsItems.forEach((item) => {
      if (item.dragging) {
        applyItemTransform(item);
        return;
      }

      if (state.physicsMode === "stickers") {
        item.vx = 0;
        item.vy = 0;
        item.angularVelocity = 0;
        clampItemToViewport(item);
        applyItemTransform(item);
        return;
      }

      item.vy += mode.gravity * deltaSeconds;

      if (mode.driftStrength > 0) {
        item.vx += Math.sin(timeStamp * 0.001 + item.floatPhase) * mode.driftStrength * deltaSeconds;
      }

      const airMultiplier = Math.pow(mode.air, deltaSeconds * 60);
      item.vx *= airMultiplier;
      item.vy *= airMultiplier;
      item.angularVelocity *= Math.pow(0.985, deltaSeconds * 60);

      item.x += item.vx * deltaSeconds;
      item.y += item.vy * deltaSeconds;
      item.rotation += item.angularVelocity * deltaSeconds * 60;

      const bounds = getItemWorldBounds(item);

      if (bounds.minX < 0) {
        item.x -= bounds.minX;
        item.vx = Math.abs(item.vx) * mode.wallBounce;
      } else if (bounds.maxX > window.innerWidth) {
        item.x -= bounds.maxX - window.innerWidth;
        item.vx = -Math.abs(item.vx) * mode.wallBounce;
      }

      if (bounds.minY < 0) {
        item.y -= bounds.minY;
        item.vy = Math.abs(item.vy) * mode.ceilingBounce;
      } else if (bounds.maxY > window.innerHeight) {
        item.y -= bounds.maxY - window.innerHeight;
        item.vy = -Math.abs(item.vy) * mode.floorBounce;
        item.vx *= mode.floorFriction;

        if (Math.abs(item.vy) < mode.restSpeed) {
          item.vy = 0;
        }

        if (Math.abs(item.vx) < 4) {
          item.vx = 0;
        }
      }

      applyItemTransform(item);
    });

    state.physicsFrameId = window.requestAnimationFrame(stepPhysics);
  };

  const startPhysicsLoop = () => {
    if (state.physicsFrameId) return;
    state.physicsLastTime = 0;
    state.physicsFrameId = window.requestAnimationFrame(stepPhysics);
  };

  const setPhysicsMode = (modeName, outputNode) => {
    const mode = PHYSICS_MODES[modeName];
    if (!mode) return;

    const wasInactive = !state.physicsMode;
    const wasSameMode = state.physicsMode === modeName;
    const items = buildPhysicsItems();

    if (!items.length) {
      appendLine(outputNode, "No movable items were found in the current view.", "error");
      return;
    }

    state.physicsMode = modeName;
    if (modeName !== "stickers") {
      clearStickerSelection();
    } else if (state.selectedStickerItem) {
      updateStickerSelectionUi();
    }
    kickItemsForMode(modeName, wasInactive);
    startPhysicsLoop();

    if (wasInactive) {
      const intro =
        modeName === "gravity"
          ? "Gravity ON."
          : modeName === "space"
            ? "Space:3"
            : "Stickers!!!";
      appendLine(outputNode, intro, "system");
      return;
    }

    if (wasSameMode) {
      appendLine(outputNode, `${mode.label} mode is already active.`, "system");
      return;
    }

    appendLine(outputNode, `Switched to ${mode.label} mode.`, "system");
  };

  const installPhysicsInteractionBlocker = () => {
    const blockIfNeeded = (event) => {
      if (!state.physicsMode) return;
      if (state.allowProgrammaticUiEvent) return;
      if (isProtectedUiTarget(event.target)) return;
      if (event.target instanceof Element && event.target.closest(`.${PHYSICS_ITEM_CLASS}`)) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
    };

    ["click", "dblclick", "submit", "contextmenu"].forEach((eventName) => {
      document.addEventListener(eventName, blockIfNeeded, true);
    });

    document.addEventListener("pointerdown", blockIfNeeded, true);
    document.addEventListener(
      "keydown",
      (event) => {
        if (!state.physicsMode) return;
        const activeElement = document.activeElement;
        if (isProtectedUiTarget(event.target) || isProtectedUiTarget(activeElement)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
      },
      true
    );
  };

  const openWindowFromTerminal = async (config, outputNode) => {
    const hasWindow = Boolean(document.getElementById(config.windowId));
    const hasApi = Boolean(getGameApi(config.apiName)?.open);

    if (!hasWindow || !hasApi) {
      appendLine(outputNode, `Loading ${config.label}...`, "system");
    }

    try {
      const gameApi = await ensureWindowCommandReady(config);
      if (!gameApi?.open) {
        appendLine(outputNode, `Could not prepare ${config.label}.`, "error");
        return false;
      }

      state.allowProgrammaticUiEvent = true;
      try {
        gameApi.open();
        schedulePartySync();
        appendLine(outputNode, `Opening ${config.label}...`, "system");
        return true;
      } catch {
        appendLine(outputNode, `Could not open ${config.label}.`, "error");
        return false;
      } finally {
        window.setTimeout(() => {
          state.allowProgrammaticUiEvent = false;
        }, 0);
      }
    } catch {
      appendLine(outputNode, `Could not load ${config.label}.`, "error");
      return false;
    }
  };

  const buildTerminalWindow = () => {
    if (!document.body) return null;
    const existing = document.getElementById(TERMINAL_WINDOW_ID);
    if (existing) return existing;

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.id = TERMINAL_TRIGGER_ID;
    trigger.setAttribute("aria-label", "Open terminal");
    trigger.title = "Open terminal";

    const windowNode = document.createElement("section");
    windowNode.id = TERMINAL_WINDOW_ID;
    windowNode.className = "xp-search-window milancholy-terminal-window";
    windowNode.setAttribute("role", "dialog");
    windowNode.setAttribute("aria-modal", "false");
    windowNode.setAttribute("aria-labelledby", "milancholyTerminalTitle");
    windowNode.setAttribute("aria-hidden", "true");
    windowNode.hidden = true;

    const titlebar = document.createElement("header");
    titlebar.className = "xp-search-titlebar milancholy-terminal-titlebar";

    const title = document.createElement("div");
    title.className = "xp-search-title milancholy-terminal-title";
    title.id = "milancholyTerminalTitle";
    title.textContent = "Milancholy Terminal";

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "xp-search-close milancholy-terminal-close";
    closeButton.setAttribute("aria-label", "Close terminal");
    closeButton.title = "Close";
    closeButton.textContent = "X";

    titlebar.appendChild(title);
    titlebar.appendChild(closeButton);

    const body = document.createElement("div");
    body.className = "xp-search-body milancholy-terminal-body";

    const screen = document.createElement("div");
    screen.className = "milancholy-terminal-screen";

    const output = document.createElement("div");
    output.className = "milancholy-terminal-output";
    output.id = TERMINAL_OUTPUT_ID;
    output.setAttribute("aria-live", "polite");

    const form = document.createElement("form");
    form.className = "milancholy-terminal-input-form";
    form.setAttribute("autocomplete", "off");

    const prompt = document.createElement("label");
    prompt.className = "milancholy-terminal-prompt";
    prompt.setAttribute("for", TERMINAL_INPUT_ID);
    prompt.textContent = "C:\\MILANCHOLY>";

    const input = document.createElement("input");
    input.id = TERMINAL_INPUT_ID;
    input.className = "milancholy-terminal-input";
    input.type = "text";
    input.autocomplete = "off";
    input.placeholder = "Type a command";
    input.setAttribute("autocapitalize", "none");
    input.setAttribute("spellcheck", "false");

    form.appendChild(prompt);
    form.appendChild(input);

    screen.appendChild(output);
    screen.appendChild(form);
    body.appendChild(screen);

    windowNode.appendChild(titlebar);
    windowNode.appendChild(body);

    document.body.appendChild(trigger);
    document.body.appendChild(windowNode);

    const openTerminal = () => {
      windowNode.hidden = false;
      windowNode.setAttribute("aria-hidden", "false");

      if (!state.bootLogged) {
        appendLine(output, `TerMILAnal on: ${detectSystem()}`, "system");
        appendLine(
          output,
          'Commands available: "gravity", "space", "stickers", "party", "help", "minesweeper", "bubble wrap", "runner"',
          "system"
        );
        state.bootLogged = true;
      }

      requestAnimationFrame(() => {
        const rect = windowNode.getBoundingClientRect();
        setWindowPosition(windowNode, rect.left, rect.top);
        input.focus();
      });
      schedulePartySync();
    };

    const closeTerminal = () => {
      windowNode.hidden = true;
      windowNode.setAttribute("aria-hidden", "true");
      schedulePartySync();
    };

    const stopPropagation = (event) => {
      event.stopPropagation();
    };

    trigger.addEventListener("pointerdown", stopPropagation);
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openTerminal();
    });

    windowNode.addEventListener("pointerdown", stopPropagation);
    windowNode.addEventListener("click", stopPropagation);
    closeButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeTerminal();
    });

    let draggingWindow = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragOriginLeft = 0;
    let dragOriginTop = 0;

    titlebar.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      if (event.target.closest("button, input, a, label")) return;
      if (windowNode.hidden) return;

      draggingWindow = true;
      dragStartX = event.clientX;
      dragStartY = event.clientY;

      const rect = windowNode.getBoundingClientRect();
      dragOriginLeft = rect.left;
      dragOriginTop = rect.top;
      windowNode.classList.add("is-dragging");

      try {
        titlebar.setPointerCapture(event.pointerId);
      } catch {
      }

      event.preventDefault();
      event.stopPropagation();
    });

    titlebar.addEventListener("pointermove", (event) => {
      if (!draggingWindow) return;

      const nextLeft = dragOriginLeft + (event.clientX - dragStartX);
      const nextTop = dragOriginTop + (event.clientY - dragStartY);
      setWindowPosition(windowNode, nextLeft, nextTop);
      event.preventDefault();
    });

    const endWindowDrag = () => {
      draggingWindow = false;
      windowNode.classList.remove("is-dragging");
    };

    titlebar.addEventListener("pointerup", endWindowDrag);
    titlebar.addEventListener("pointercancel", endWindowDrag);
    titlebar.addEventListener("lostpointercapture", endWindowDrag);

    window.addEventListener("resize", () => {
      if (!windowNode.hidden) {
        const rect = windowNode.getBoundingClientRect();
        setWindowPosition(windowNode, rect.left, rect.top);
      }

      state.physicsItems.forEach((item) => {
        clampItemToViewport(item);
        applyItemTransform(item);
      });

      const helpWindow = document.getElementById(HELP_WINDOW_ID);
      if (helpWindow instanceof HTMLElement && !helpWindow.hidden) {
        const rect = helpWindow.getBoundingClientRect();
        setWindowPosition(helpWindow, rect.left, rect.top);
      }

      if (state.selectedStickerItem) {
        updateStickerSelectionUi();
      }

      if (state.partyMode) {
        syncPartyNodes();
      }
    });

    window.addEventListener("hashchange", () => {
      if (state.partyMode) {
        syncPartyNodes();
      }
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const command = sanitizePlainText(input.value, {
        multiline: false,
        maxLength: DEFAULT_SINGLE_LINE_LIMIT,
      }).trim();

      if (!command) return;

      appendLine(output, `C:\\MILANCHOLY> ${command}`, "command");
      input.value = "";

      const normalized = command.toLowerCase();
      if (normalized === "gravity" || normalized === "space" || normalized === "stickers") {
        setPhysicsMode(normalized, output);
        return;
      }

      if (normalized === "party") {
        setPartyMode(output);
        return;
      }

      if (normalized === "help") {
        openHelpWindow(output);
        return;
      }

      if (normalized === "minesweeper") {
        void openWindowFromTerminal(WINDOW_COMMANDS.minesweeper, output);
        return;
      }

      if (normalized === "bubble wrap") {
        void openWindowFromTerminal(WINDOW_COMMANDS["bubble wrap"], output);
        return;
      }

      if (normalized === "runner") {
        appendLine(output, "Opening Runner...", "system");
        window.location.href = RUNNER_URL;
        return;
      }

      appendLine(
        output,
        `"${command}" is not recognized as an internal or external command.`,
        "error"
      );
    });

    protectTextField(input);
    return windowNode;
  };

  const init = () => {
    injectStyles();
    protectTextFieldsWithin(document);
    watchTextFields();
    installStickerRotateControl();
    installStickerOutsideClickClear();
    buildTerminalWindow();
    installPhysicsInteractionBlocker();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
