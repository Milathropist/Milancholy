(() => {
  const WINDOW_MARGIN = 12;
  const CLOSE_DURATION = 260;
  const state = {
    expression: "",
    justEvaluated: false,
    hasPosition: false,
    isClosing: false,
    closeTimer: 0,
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const tokenize = (source) => {
    const tokens = [];
    let index = 0;
    while (index < source.length) {
      const char = source[index];
      if (/\s/.test(char)) {
        index += 1;
        continue;
      }
      if (/[0-9.]/.test(char)) {
        const match = source.slice(index).match(/^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i);
        if (!match) throw new Error("Invalid number");
        const value = Number(match[0]);
        if (!Number.isFinite(value)) throw new Error("Invalid number");
        tokens.push({ type: "number", value });
        index += match[0].length;
        continue;
      }
      if (/[a-z]/i.test(char)) {
        const match = source.slice(index).match(/^[a-z]+/i)[0].toLowerCase();
        tokens.push({ type: "name", value: match });
        index += match.length;
        continue;
      }
      if ("+-*/^!%()".includes(char)) {
        tokens.push({ type: char, value: char });
        index += 1;
        continue;
      }
      throw new Error("Unknown symbol");
    }
    return tokens;
  };

  const calculate = (source) => {
    const tokens = tokenize(source);
    let index = 0;
    const peek = (type) => tokens[index]?.type === type;
    const take = (type) => {
      if (!peek(type)) throw new Error("Incomplete expression");
      return tokens[index++];
    };
    const startsPrimary = () => peek("number") || peek("name") || peek("(");

    const factorial = (value) => {
      if (!Number.isInteger(value) || value < 0 || value > 170) {
        throw new Error("Factorial needs an integer from 0 to 170");
      }
      let result = 1;
      for (let number = 2; number <= value; number += 1) result *= number;
      return result;
    };

    const functions = {
      sin: Math.sin,
      cos: Math.cos,
      tan: Math.tan,
      sqrt: Math.sqrt,
      ln: Math.log,
      log: Math.log10,
    };

    const parsePrimary = () => {
      if (peek("number")) return take("number").value;
      if (peek("(")) {
        take("(");
        const value = parseExpression();
        take(")");
        return value;
      }
      if (peek("name")) {
        const name = take("name").value;
        if (name === "pi") return Math.PI;
        if (name === "e") return Math.E;
        if (!functions[name]) throw new Error("Unknown function");
        take("(");
        const value = parseExpression();
        take(")");
        return functions[name](value);
      }
      throw new Error("Incomplete expression");
    };

    const parsePostfix = () => {
      let value = parsePrimary();
      while (peek("!") || peek("%")) {
        if (peek("!")) {
          take("!");
          value = factorial(value);
        } else {
          take("%");
          value /= 100;
        }
      }
      return value;
    };

    const parsePower = () => {
      const value = parsePostfix();
      if (!peek("^")) return value;
      take("^");
      return value ** parseUnary();
    };

    const parseUnary = () => {
      if (peek("+")) {
        take("+");
        return parseUnary();
      }
      if (peek("-")) {
        take("-");
        return -parseUnary();
      }
      return parsePower();
    };

    const parseTerm = () => {
      let value = parseUnary();
      while (peek("*") || peek("/") || startsPrimary()) {
        if (peek("*")) {
          take("*");
          value *= parseUnary();
        } else if (peek("/")) {
          take("/");
          value /= parseUnary();
        } else {
          value *= parseUnary();
        }
      }
      return value;
    };

    const parseExpression = () => {
      let value = parseTerm();
      while (peek("+") || peek("-")) {
        if (peek("+")) {
          take("+");
          value += parseTerm();
        } else {
          take("-");
          value -= parseTerm();
        }
      }
      return value;
    };

    if (!tokens.length) return 0;
    const result = parseExpression();
    if (index !== tokens.length || !Number.isFinite(result)) throw new Error("Math error");
    return result;
  };

  const formatNumber = (value) => {
    if (Object.is(value, -0)) return "0";
    const magnitude = Math.abs(value);
    if ((magnitude >= 1e12 || (magnitude > 0 && magnitude < 1e-9))) {
      return value.toExponential(9).replace(/\.?(0+)e/, "e");
    }
    return Number(value.toPrecision(12)).toString();
  };

  const prettyExpression = (value) =>
    value.replace(/sqrt/g, "√").replace(/pi/g, "π").replace(/\*/g, "×").replace(/\//g, "÷");

  const init = () => {
    const windowNode = document.getElementById("calculatorWindow");
    const expressionNode = document.getElementById("calculatorExpression");
    const resultNode = document.getElementById("calculatorResult");
    const scientificNode = document.getElementById("calculatorScientific");
    const modeButton = windowNode?.querySelector('[data-calc-action="mode"]');
    const closeButton = windowNode?.querySelector("[data-calculator-close]");
    const dragHandle = windowNode?.querySelector("[data-calculator-drag-handle]");
    const musicPlayer = windowNode?.querySelector(".calculator-music");
    const musicAudio = windowNode?.querySelector(".calculator-music-audio");
    const musicToggle = windowNode?.querySelector("[data-calculator-music-toggle]");
    const musicProgress = windowNode?.querySelector("[data-calculator-music-progress]");
    const musicVolume = windowNode?.querySelector("[data-calculator-music-volume]");
    const musicCurrent = windowNode?.querySelector("[data-calculator-music-current]");
    const musicDuration = windowNode?.querySelector("[data-calculator-music-duration]");
    const musicBars = Array.from(
      windowNode?.querySelectorAll(".calculator-music-visualizer i") || []
    );
    if (!windowNode || !expressionNode || !resultNode || !scientificNode || !modeButton) return;

    let audioContext = null;
    let audioSource = null;
    let audioAnalyser = null;
    let frequencyData = null;
    let visualizerFrame = 0;

    windowNode.querySelectorAll("button[data-calc-name]").forEach((button) => {
      if (!button.hasAttribute("aria-label")) {
        button.setAttribute("aria-label", button.dataset.calcName);
      }
      button.removeAttribute("title");
    });

    const formatTime = (seconds) => {
      const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
      const minutes = Math.floor(safeSeconds / 60);
      const remainder = Math.floor(safeSeconds % 60);
      return `${minutes}:${String(remainder).padStart(2, "0")}`;
    };

    const setRangeFill = (input, ratio) => {
      if (!input) return;
      input.style.setProperty("--range-fill", `${clamp(ratio, 0, 1) * 100}%`);
    };

    const resetMusicVisualizer = () => {
      if (visualizerFrame) {
        window.cancelAnimationFrame(visualizerFrame);
        visualizerFrame = 0;
      }
      musicBars.forEach((bar) => bar.style.setProperty("--bar-level", "0.45"));
    };

    const ensureAudioAnalyser = async () => {
      if (!musicAudio || !musicBars.length) return false;
      if (!audioAnalyser) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return false;
        try {
          audioContext = new AudioContextClass();
          audioSource = audioContext.createMediaElementSource(musicAudio);
          audioAnalyser = audioContext.createAnalyser();
          audioAnalyser.fftSize = 512;
          audioAnalyser.smoothingTimeConstant = 0.74;
          frequencyData = new Uint8Array(audioAnalyser.frequencyBinCount);
          audioSource.connect(audioAnalyser);
          audioAnalyser.connect(audioContext.destination);
        } catch {
          audioAnalyser = null;
          return false;
        }
      }
      if (audioContext?.state === "suspended") {
        try {
          await audioContext.resume();
        } catch {
          return false;
        }
      }
      return true;
    };

    const drawMusicVisualizer = () => {
      if (!musicAudio || musicAudio.paused || musicAudio.ended || !audioAnalyser || !frequencyData) {
        resetMusicVisualizer();
        return;
      }

      audioAnalyser.getByteFrequencyData(frequencyData);
      const bands = [
        [1, 3],
        [3, 6],
        [6, 12],
        [12, 24],
        [24, 56],
      ];
      const highFrequencyBoost = [1, 1.02, 1.08, 1.2, 1.38];

      musicBars.forEach((bar, barIndex) => {
        const [start, end] = bands[barIndex] || bands[bands.length - 1];
        let total = 0;
        for (let bin = start; bin < end; bin += 1) total += frequencyData[bin] || 0;
        const average = total / Math.max(1, end - start);
        const response = Math.pow(average / 255, 0.64) * highFrequencyBoost[barIndex];
        const level = clamp(0.38 + response * 2.75, 0.38, 3.15);
        bar.style.setProperty("--bar-level", level.toFixed(2));
      });

      visualizerFrame = window.requestAnimationFrame(drawMusicVisualizer);
    };

    const startMusicVisualizer = async () => {
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
        resetMusicVisualizer();
        return;
      }
      if (!(await ensureAudioAnalyser())) return;
      if (visualizerFrame) window.cancelAnimationFrame(visualizerFrame);
      drawMusicVisualizer();
    };

    const syncMusicPlayer = () => {
      if (!musicAudio || !musicPlayer || !musicToggle || !musicProgress) return;
      const duration = Number.isFinite(musicAudio.duration) ? musicAudio.duration : 0;
      const ratio = duration > 0 ? musicAudio.currentTime / duration : 0;
      musicProgress.value = String(ratio * 100);
      setRangeFill(musicProgress, ratio);
      if (musicCurrent) musicCurrent.textContent = formatTime(musicAudio.currentTime);
      if (musicDuration) musicDuration.textContent = formatTime(duration);
      const isPlaying = !musicAudio.paused && !musicAudio.ended;
      musicPlayer.classList.toggle("is-playing", isPlaying);
      musicToggle.setAttribute("aria-label", isPlaying ? "Pause Moonlit" : "Play Moonlit");
      musicToggle.dataset.calcName = isPlaying ? "Pause" : "Play";
    };

    const render = (showError = false) => {
      expressionNode.textContent = state.expression ? prettyExpression(state.expression) : "\u00a0";
      if (showError) {
        resultNode.textContent = "Error";
        resultNode.classList.add("is-error");
        return;
      }
      resultNode.classList.remove("is-error");
      if (!state.expression) {
        resultNode.textContent = "0";
        return;
      }
      try {
        resultNode.textContent = formatNumber(calculate(state.expression));
      } catch {
        resultNode.textContent = "…";
      }
    };

    const appendValue = (value) => {
      if (state.justEvaluated && /[0-9.(a-z]/i.test(value[0])) state.expression = "";
      state.justEvaluated = false;
      if (/[+*/^]/.test(value) && /[+\-*/^]$/.test(state.expression)) {
        state.expression = state.expression.slice(0, -1);
      }
      state.expression += value;
      render();
    };

    const evaluate = () => {
      try {
        const result = calculate(state.expression);
        expressionNode.textContent = `${prettyExpression(state.expression)} =`;
        state.expression = formatNumber(result);
        resultNode.textContent = state.expression;
        resultNode.classList.remove("is-error");
        state.justEvaluated = true;
      } catch {
        render(true);
      }
    };

    const runAction = (action) => {
      if (action === "clear") {
        state.expression = "";
        state.justEvaluated = false;
        render();
      } else if (action === "backspace") {
        state.expression = state.expression.slice(0, -1);
        state.justEvaluated = false;
        render();
      } else if (action === "equals") {
        evaluate();
      } else if (action === "square" && state.expression) {
        state.expression = `(${state.expression})^2`;
        state.justEvaluated = false;
        render();
      } else if (action === "reciprocal" && state.expression) {
        state.expression = `1/(${state.expression})`;
        state.justEvaluated = false;
        render();
      } else if (action === "sign" && state.expression) {
        state.expression = `-(${state.expression})`;
        state.justEvaluated = false;
        render();
      } else if (action === "mode") {
        const expanded = scientificNode.hidden;
        scientificNode.hidden = !expanded;
        windowNode.classList.toggle("is-scientific", expanded);
        modeButton.setAttribute("aria-expanded", String(expanded));
        modeButton.dataset.calcName = expanded ? "Basic functions" : "Scientific functions";
        modeButton.setAttribute(
          "aria-label",
          expanded ? "Hide scientific functions" : "Show scientific functions"
        );
        requestAnimationFrame(() => keepInViewport());
      }
    };

    const keepInViewport = () => {
      const rect = windowNode.getBoundingClientRect();
      const maxLeft = Math.max(WINDOW_MARGIN, window.innerWidth - rect.width - WINDOW_MARGIN);
      const maxTop = Math.max(WINDOW_MARGIN, window.innerHeight - rect.height - WINDOW_MARGIN);
      windowNode.style.left = `${Math.round(clamp(rect.left, WINDOW_MARGIN, maxLeft))}px`;
      windowNode.style.top = `${Math.round(clamp(rect.top, WINDOW_MARGIN, maxTop))}px`;
      state.hasPosition = true;
    };

    const finishClose = () => {
      window.clearTimeout(state.closeTimer);
      state.closeTimer = 0;
      state.isClosing = false;
      windowNode.classList.remove("is-closing");
      windowNode.hidden = true;
      windowNode.setAttribute("aria-hidden", "true");
    };

    const close = () => {
      if (windowNode.hidden || state.isClosing) return;
      musicAudio?.pause();
      const windowEffects = window.__milancholyWindowEffects;
      if (windowEffects?.close) {
        state.isClosing = true;
        windowEffects.close(windowNode, () => {
          state.isClosing = false;
          state.closeTimer = 0;
        });
        return;
      }
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
        finishClose();
        return;
      }
      state.isClosing = true;
      windowNode.classList.add("is-closing");
      state.closeTimer = window.setTimeout(finishClose, CLOSE_DURATION + 50);
    };

    const open = () => {
      window.clearTimeout(state.closeTimer);
      window.__milancholyWindowEffects?.cancelClose?.(windowNode);
      state.isClosing = false;
      windowNode.classList.remove("is-closing");
      windowNode.hidden = false;
      windowNode.setAttribute("aria-hidden", "false");
      requestAnimationFrame(() => {
        if (!state.hasPosition) {
          const rect = windowNode.getBoundingClientRect();
          windowNode.style.left = `${Math.max(WINDOW_MARGIN, (window.innerWidth - rect.width) / 2)}px`;
          windowNode.style.top = `${Math.max(WINDOW_MARGIN, (window.innerHeight - rect.height) / 2)}px`;
        }
        keepInViewport();
        windowNode.querySelector(".calculator-keypad button")?.focus();
      });
    };

    windowNode.addEventListener("click", (event) => {
      event.stopPropagation();
      const button = event.target.closest("button");
      if (!button) return;
      if (button.dataset.calcValue) appendValue(button.dataset.calcValue);
      if (button.dataset.calcAction) runAction(button.dataset.calcAction);
    });
    windowNode.addEventListener("pointerdown", (event) => event.stopPropagation());
    closeButton?.addEventListener("click", close);

    if (musicAudio && musicToggle && musicProgress && musicVolume) {
      musicAudio.loop = true;
      musicAudio.volume = Number(musicVolume.value);
      setRangeFill(musicVolume, musicAudio.volume);
      ["loadedmetadata", "durationchange", "timeupdate", "play", "pause", "ended"].forEach(
        (eventName) => musicAudio.addEventListener(eventName, syncMusicPlayer)
      );
      musicAudio.addEventListener("play", () => void startMusicVisualizer());
      musicAudio.addEventListener("pause", resetMusicVisualizer);
      musicAudio.addEventListener("ended", resetMusicVisualizer);
      musicToggle.addEventListener("click", async () => {
        if (musicAudio.paused) {
          try {
            await ensureAudioAnalyser();
            await musicAudio.play();
          } catch {
            syncMusicPlayer();
          }
        } else {
          musicAudio.pause();
        }
      });
      musicProgress.addEventListener("input", () => {
        if (!Number.isFinite(musicAudio.duration) || musicAudio.duration <= 0) return;
        musicAudio.currentTime = (Number(musicProgress.value) / 100) * musicAudio.duration;
        syncMusicPlayer();
      });
      musicVolume.addEventListener("input", () => {
        musicAudio.volume = clamp(Number(musicVolume.value), 0, 1);
        setRangeFill(musicVolume, musicAudio.volume);
      });
      syncMusicPlayer();
    }

    document.addEventListener("keydown", (event) => {
      if (windowNode.hidden || state.isClosing) return;
      if (event.key === "Escape") return close();
      if (event.key === "Enter" || event.key === "=") {
        event.preventDefault();
        evaluate();
      } else if (event.key === "Backspace") {
        event.preventDefault();
        runAction("backspace");
      } else if (event.key === "Delete") {
        event.preventDefault();
        runAction("clear");
      } else if (/^[0-9.+\-*/^()%!]$/.test(event.key)) {
        event.preventDefault();
        appendValue(event.key);
      }
    });

    if (dragHandle) {
      let dragging = false;
      let startX = 0;
      let startY = 0;
      let startLeft = 0;
      let startTop = 0;
      dragHandle.addEventListener("pointerdown", (event) => {
        if (event.button !== 0 || event.target.closest("button")) return;
        const rect = windowNode.getBoundingClientRect();
        dragging = true;
        startX = event.clientX;
        startY = event.clientY;
        startLeft = rect.left;
        startTop = rect.top;
        windowNode.classList.add("is-dragging");
        dragHandle.setPointerCapture?.(event.pointerId);
        event.preventDefault();
      });
      dragHandle.addEventListener("pointermove", (event) => {
        if (!dragging) return;
        const rect = windowNode.getBoundingClientRect();
        const maxLeft = Math.max(WINDOW_MARGIN, window.innerWidth - rect.width - WINDOW_MARGIN);
        const maxTop = Math.max(WINDOW_MARGIN, window.innerHeight - rect.height - WINDOW_MARGIN);
        windowNode.style.left = `${clamp(startLeft + event.clientX - startX, WINDOW_MARGIN, maxLeft)}px`;
        windowNode.style.top = `${clamp(startTop + event.clientY - startY, WINDOW_MARGIN, maxTop)}px`;
      });
      const endDrag = () => {
        dragging = false;
        windowNode.classList.remove("is-dragging");
        state.hasPosition = true;
      };
      dragHandle.addEventListener("pointerup", endDrag);
      dragHandle.addEventListener("pointercancel", endDrag);
      dragHandle.addEventListener("lostpointercapture", endDrag);
    }

    window.addEventListener("resize", () => {
      if (!windowNode.hidden) keepInViewport();
    });
    window.__milancholyGames = window.__milancholyGames || {};
    window.__milancholyGames.calculator = { open, close };
    windowNode.dataset.gameReady = "true";
    render();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
