/**
 * SmartRTL Content Script (Manifest V3)
 * Zero-latency instant text direction correction for AI chat tools.
 */

(function () {
  'use strict';

  let currentMode = 'auto';
  const ARABIC_REGEX = /\p{Script=Arabic}/u;

  const LEAF_TEXT_SELECTOR = 'p, li, h1, h2, h3, h4, h5, h6, textarea, [contenteditable="true"]';
  const EXCLUDE_SELECTOR = 'pre, code, kbd, samp, button, svg, img, [role="button"], [class*="button"], [class*="icon"]';

  function isCodeSnippet(text) {
    if (!text || typeof text !== 'string') return false;
    const trimmed = text.trim();
    const codePatterns = [
      /\b(function|const|let|var|return|import|export|class|if|for|while|console\.log)\b/,
      /[{}()[\];=<>+\-*/!&|]/,
      /^[a-zA-Z0-9_\-]+\s*[:=]\s*/,
      /;$/
    ];
    let matches = 0;
    for (let i = 0; i < codePatterns.length; i++) {
      if (codePatterns[i].test(trimmed)) matches++;
    }
    return matches >= 2 && !ARABIC_REGEX.test(trimmed);
  }

  function isExcluded(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return true;
    return node.closest(EXCLUDE_SELECTOR) !== null;
  }

  function containsArabic(text) {
    if (!text || typeof text !== 'string') return false;
    return ARABIC_REGEX.test(text);
  }

  function processElement(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return;
    if (isExcluded(el)) return;

    const isInput = el.tagName === 'TEXTAREA' || el.getAttribute('contenteditable') === 'true';
    const text = isInput ? (el.value || el.innerText || '') : (el.innerText || el.textContent || '');

    if (isCodeSnippet(text)) {
      el.style.direction = 'ltr';
      el.style.textAlign = 'left';
      if (isInput) el.setAttribute('dir', 'ltr');
      return;
    }

    if (currentMode === 'force-rtl') {
      el.style.direction = 'rtl';
      el.style.textAlign = 'right';
      if (isInput) el.setAttribute('dir', 'rtl');
    } else if (currentMode === 'force-ltr') {
      el.style.direction = 'ltr';
      el.style.textAlign = 'left';
      if (isInput) el.setAttribute('dir', 'ltr');
    } else if (currentMode === 'auto') {
      if (containsArabic(text)) {
        el.style.direction = 'rtl';
        el.style.textAlign = 'right';
        if (isInput) el.setAttribute('dir', 'rtl');
      } else {
        if (el.style.direction === 'rtl') {
          el.style.direction = '';
          el.style.textAlign = '';
          if (isInput) el.removeAttribute('dir');
        }
      }
    }
  }

  function scanAndApply() {
    const elements = document.querySelectorAll(LEAF_TEXT_SELECTOR);
    for (let i = 0; i < elements.length; i++) {
      processElement(elements[i]);
    }
  }

  // Instant MutationObserver with ZERO latency / no debouncing
  const observer = new MutationObserver((mutations) => {
    for (let m = 0; m < mutations.length; m++) {
      const mut = mutations[m];
      
      // If text content changed directly on an element
      if (mut.type === 'characterData' && mut.target && mut.target.parentNode) {
        const parentEl = mut.target.parentNode;
        if (parentEl.nodeType === Node.ELEMENT_NODE && parentEl.matches && parentEl.matches(LEAF_TEXT_SELECTOR)) {
          processElement(parentEl);
        }
      }

      // If new nodes were added
      for (let n = 0; n < mut.addedNodes.length; n++) {
        const node = mut.addedNodes[n];
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.matches && node.matches(LEAF_TEXT_SELECTOR)) {
            processElement(node);
          }
          const children = node.querySelectorAll(LEAF_TEXT_SELECTOR);
          for (let c = 0; c < children.length; c++) {
            processElement(children[c]);
          }
        }
      }
    }
  });

  function startObserving() {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  // Instant keystroke event listeners for prompt fields
  document.addEventListener('input', (e) => {
    const target = e.target;
    if (target && target.nodeType === Node.ELEMENT_NODE && (target.tagName === 'TEXTAREA' || target.getAttribute('contenteditable') === 'true')) {
      processElement(target);
    }
  }, true);

  document.addEventListener('keyup', (e) => {
    const target = e.target;
    if (target && target.nodeType === Node.ELEMENT_NODE && (target.tagName === 'TEXTAREA' || target.getAttribute('contenteditable') === 'true')) {
      processElement(target);
    }
  }, true);

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['smartRtlMode'], (result) => {
      if (result.smartRtlMode) {
        currentMode = result.smartRtlMode;
      }
      scanAndApply();
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.smartRtlMode) {
        currentMode = changes.smartRtlMode.newValue;
        scanAndApply();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      scanAndApply();
      startObserving();
    });
  } else {
    scanAndApply();
    startObserving();
  }

  window.addEventListener('load', () => {
    scanAndApply();
  });

})();
