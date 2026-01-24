const { Plugin } = require('obsidian');
const { ViewPlugin, Decoration } = require('@codemirror/view');
const { RangeSetBuilder } = require('@codemirror/state');

class PrismSyntaxHighlighter extends Plugin {
  async onload() {
    this.readyState = {
      prism: null,
      loadedLanguages: new Set(),
      unsupportedLanguages: new Set()
    };

    try {
      this.readyState.prism = await this.loadPrism();
      console.log("Prism.js successfully loaded");

      this.registerMarkdownPostProcessor(el => {
        if (this.readyState.prism) {
          this._processCodeBlocks(el);
        }
      });

      this.registerEditorExtension([
        ViewPlugin.fromClass(
          this._createViewPluginClass(),
          { decorations: v => v.decorations }
        )
      ]);

      this.registerDomEvent(window, 'prism-language-loaded', () => {
        this.app.workspace.updateOptions();
      });
    } catch (e) {
      console.error("Prism Plugin initialization failed:", e);
      new Notice("Prism Syntax Highlight Plugin failed to load");
    }
  }

  _createViewPluginClass() {
    const plugin = this;

    return class {
      constructor(view) {
        this.plugin = plugin;
        this.decorations = this.getDecorations(view);
      }

      update(update) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.getDecorations(update.view);
        }
      }

      getDecorations(view) {
        return plugin._getDecorationsFromTokens(view.state.doc.toString());
      }
    };
  }

  _getDecorationsFromTokens(text) {
    const builder = new RangeSetBuilder();

    if (!this.readyState.prism) {
      return builder.finish();
    }

    const regex = /```(\S+)[\s\S]*?```/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const lang = match[1].toLowerCase().trim();
      if (!lang) continue;

      const blockStart = match.index;
      const blockEnd = blockStart + match[0].length;
      const codeStart = blockStart + match[1].length + 3;

      builder.add(blockStart, codeStart, Decoration.mark({ class: 'token code-block-delimiter' }));

      if (this.readyState.prism.languages && this.readyState.prism.languages[lang]) {
        try {
          const code = text.substring(codeStart, blockEnd - 3);
          const tokens = this.readyState.prism.tokenize(code, this.readyState.prism.languages[lang]);
          this._processTokens(tokens, builder, codeStart, 0, '', lang);
        } catch (e) {
          console.error(`Failed to tokenize code block: ${lang}`, e);
        }
      }

      builder.add(blockEnd - 3, blockEnd, Decoration.mark({ class: 'token code-block-delimiter' }));
    }

    return builder.finish();
  }

  _processTokens(tokens, builder, offset, pos = 0, parentClass = '', lang = '') {
    tokens.forEach(token => {
      if (typeof token === 'string') {
        pos += token.length;
        return;
      }

      let tokenClass = parentClass ? `${parentClass} ${token.type}` : `${token.type}`;
      tokenClass = token.alias ? `${tokenClass} ${token.alias}` : tokenClass;
      tokenClass = `token ${tokenClass.trim()} language-${lang}`;

      if (typeof token.content === 'string') {
        builder.add(offset + pos, offset + pos + token.content.length, Decoration.mark({ class: tokenClass }));
        pos += token.content.length;
      } else if (Array.isArray(token.content)) {
        token.content.forEach(subToken => {
          if (typeof subToken === 'string') {
            pos += subToken.length;
          } else {
            this._processTokens([subToken], builder, offset, pos, tokenClass, lang);
          }
        });
      } else {
        this._processTokens([token.content], builder, offset, pos, tokenClass, lang);
      }
    });
  }

  async loadPrism() {
    if (window.Prism) {
      return window.Prism;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/lib/prism.min.js';
      script.onload = () => {
        if (window.Prism) {
          resolve(window.Prism);
        } else {
          reject(new Error("Prism.js failed to load"));
        }
      };
      script.onerror = () => {
        reject(new Error("Prism.js failed to load"));
      };
      document.head.appendChild(script);
    });
  }

  _processCodeBlocks(element) {
    if (!this.readyState.prism) return;

    element.querySelectorAll('pre > code').forEach(block => {
      const match = /language-(\S+)/.exec(block.className);
      if (!match) return;

      const lang = match[1].toLowerCase().trim();
      if (!lang) return;

      try {
        if (this.readyState.prism.languages[lang]) {
          this.readyState.prism.highlightElement(block);
        }
      } catch (e) {
        console.error(`Failed to highlight code block: ${lang}`, e);
      }
    });
  }

  onunload() {
  }
}

module.exports = PrismSyntaxHighlighter;
