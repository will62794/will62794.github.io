(function () {
  function promoteMermaidBlocks() {
    var blocks = document.querySelectorAll("code.language-mermaid");
    blocks.forEach(function (code) {
      var wrapper = code.closest(".highlighter-rouge") || code.parentElement;
      var diagram = document.createElement("div");
      diagram.className = "mermaid";
      diagram.textContent = code.textContent;
      wrapper.replaceWith(diagram);
    });
    return document.querySelectorAll(".mermaid").length > 0;
  }

  function renderMermaid() {
    if (typeof mermaid === "undefined" || !promoteMermaidBlocks()) {
      return;
    }

    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose",
    });

    mermaid.run().catch(function (err) {
      console.error("Mermaid render failed:", err);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderMermaid);
  } else {
    renderMermaid();
  }
})();
