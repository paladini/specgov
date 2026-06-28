/* global document, navigator, window */

const blocks = document.querySelectorAll(".copy-block");

for (const block of blocks) {
  const shell = document.createElement("div");
  shell.className = "copy-shell";
  block.before(shell);
  shell.append(block);

  const button = document.createElement("button");
  button.className = "copy-button";
  button.type = "button";
  button.textContent = "Copy";
  button.setAttribute("aria-label", "Copy code block");

  button.addEventListener("click", async () => {
    const code = block.querySelector("code");
    const text = code?.textContent ?? "";
    const copied = await copyText(text.trim());
    if (copied) {
      showTemporaryStatus(button, "Copied");
    } else if (selectCode(code)) {
      showTemporaryStatus(button, "Selected");
    } else {
      button.textContent = "Select";
    }
  });

  shell.append(button);
}

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    return fallbackCopy(text);
  }

  return fallbackCopy(text);
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.append(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } finally {
    textarea.remove();
  }
}

function selectCode(code) {
  if (!code) {
    return false;
  }

  const selection = window.getSelection();
  if (!selection) {
    return false;
  }

  const range = document.createRange();
  range.selectNodeContents(code);
  selection.removeAllRanges();
  selection.addRange(range);
  return true;
}

function showTemporaryStatus(button, status) {
  button.textContent = status;
  window.setTimeout(() => {
    button.textContent = "Copy";
  }, 1400);
}
