/* cockpit-config asset revision: cockpit-config-v3 */
"use strict";
(() => {
  // ../../../pkg/lib/cockpit-dark-theme.ts
  function debug(...args) {
    if (window.debugging == "all" || window.debugging?.includes("style")) {
      console.debug([`cockpit-dark-theme: ${document.documentElement.id}:`, ...args].join(" "));
    }
  }
  function changeDarkThemeClass(documentElement, dark_mode) {
    debug(`Setting cockpit theme to ${dark_mode ? "dark" : "light"}`);
    if (dark_mode) {
      documentElement.classList.add("pf-v6-theme-dark");
    } else {
      documentElement.classList.remove("pf-v6-theme-dark");
    }
  }
  function _setDarkMode(_style) {
    const style = _style || localStorage.getItem("shell:style") || "auto";
    let dark_mode;
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches && style === "auto" || style === "dark") {
      dark_mode = true;
    } else {
      dark_mode = false;
    }
    changeDarkThemeClass(document.documentElement, dark_mode);
  }
  window.addEventListener("storage", (event) => {
    if (event.key === "shell:style") {
      debug(`Storage element 'shell:style' changed from  ${event.oldValue} to ${event.newValue}`);
      _setDarkMode();
    }
  });
  window.addEventListener("cockpit-style", (event) => {
    if (event instanceof CustomEvent) {
      const style = event.detail.style;
      debug(`Event received from shell with 'cockpit-style'  ${style}`);
      _setDarkMode(style);
    }
  });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    debug(`Operating system theme preference changed to ${window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light"}`);
    _setDarkMode();
  });
  _setDarkMode();
})();
