var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

var main_exports = {};
__export(main_exports, {
  default: () => PrismSyntaxHighlightingPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var import_view = require("@codemirror/view");
var import_state = require("@codemirror/state");

class PrismSyntaxHighlightingPlugin extends import_obsidian.Plugin {
  async onload() {
    this.readyState = {
      prism: null,
      loadedLanguages: new Set(),
      unsupportedLanguages: new Set()
    };

    this.supportedLanguages = new Set([
      "markup", "html", "xml", "svg", "mathml", "css", "clike", "javascript", "js",
      "abap", "abnf", "actionscript", "ada", "agda", "al", "antlr4", "apacheconf",
      "apex", "apl", "applescript", "aql", "arduino", "arff", "asciidoc", "aspnet",
      "asm6502", "autohotkey", "autoit", "bash", "basic", "batch", "bbcode", "birb",
      "bison", "bnf", "brainfuck", "brightscript", "bro", "bsl", "c", "csharp", "cs",
      "dotnet", "cpp", "cfscript", "chaiscript", "cil", "clojure", "cmake", "cobol",
      "coffeescript", "concurnas", "csp", "coq", "crystal", "css-extras", "csv",
      "cypher", "d", "dart", "dataweave", "dax", "dhall", "diff", "django", "jinja2",
      "dns-zone-file", "docker", "dockerfile", "dot", "ebnf", "editorconfig", "eiffel",
      "ejs", "elixir", "elm", "etlua", "erb", "erlang", "excel-formula", "xlsx", "xls",
      "fsharp", "factor", "false", "firestore-security-rules", "flow", "fortran", "ftl",
      "gcode", "gdscript", "gedcom", "gherkin", "git", "glsl", "gml", "go", "graphql",
      "groovy", "haml", "handlebars", "haskell", "haxe", "hcl", "hlsl", "http", "hpkp",
      "hsts", "ichigojam", "icon", "icu-message-format", "idris", "ignore", "inform7",
      "ini", "io", "j", "java", "javadoc", "javadoclike", "javastacktrace", "jexl",
      "jolie", "jq", "jsdoc", "js-extras", "js-templates", "json", "json5", "jsonp",
      "jsstacktrace", "jsx", "julia", "keyman", "kotlin", "kumir", "latex", "latte",
      "less", "lilypond", "liquid", "lisp", "livescript", "llvm", "log", "lolcode",
      "lua", "makefile", "markdown", "markup-templating", "matlab", "mel", "mermaid",
      "mizar", "mongodb", "monkey", "moonscript", "n1ql", "n4js", "nand2tetris-hdl",
      "naniscript", "nasm", "neon", "nevod", "nginx", "nim", "nix", "nsis", "objectivec",
      "ocaml", "opencl", "openqasm", "oz", "parigp", "parser", "pascal", "pascaligo",
      "psl", "pcaxis", "peoplecode", "perl", "php", "phpdoc", "php-extras", "plsql",
      "powerquery", "powershell", "processing", "prolog", "promql", "properties",
      "protobuf", "pug", "puppet", "pure", "purebasic", "purescript", "python", "q",
      "qml", "qore", "r", "racket", "jsx", "tsx", "reason", "regex", "rego", "renpy",
      "rest", "rip", "roboconf", "robotframework", "ruby", "rust", "sas", "sass", "scss",
      "scala", "scheme", "shell-session", "smali", "smalltalk", "smarty", "sml", "solidity",
      "solution-file", "soy", "sparql", "splunk-spl", "sqf", "sql", "squirrel", "stan",
      "iecst", "stylus", "swift", "t4-templating", "t4-cs", "t4-vb", "tap", "tcl", "tt2",
      "textile", "toml", "tremor", "turtle", "twig", "typescript", "ts", "typoscript",
      "unrealscript", "uri", "v", "vala", "vbnet", "velocity", "verilog", "vhdl", "vim",
      "visual-basic", "vb", "warpscript", "wasm", "wiki", "wolfram", "xeora", "xml-doc",
      "xojo", "xquery", "yaml", "yang", "zig"
    ]);

    try {
      this.readyState.prism = await this._loadPrism();

      this.registerMarkdownPostProcessor(el => {
        if (this.readyState.prism) {
          this._processCodeBlocks(el);
        }
      });

      this.registerEditorExtension([
        import_view.ViewPlugin.fromClass(
          this._createViewPluginClass(),
          { decorations: v => v.decorations }
        )
      ]);

      this.registerDomEvent(window, 'prism-language-loaded', () => {
        this.app.workspace.updateOptions();
      });
    } catch (e) {
      console.error("Prism 플러그인 초기화 실패:", e);
      new import_obsidian.Notice("Prism 구문 강조 플러그인 로드 실패");
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
        const builder = new import_state.RangeSetBuilder();

        if (!this.plugin.readyState.prism) {
          return builder.finish();
        }

        const text = view.state.doc.toString();
        const regex = /```(\S+)[\s\S]*?```/g;

        let match;
        while ((match = regex.exec(text)) !== null) {
          const lang = match[1].toLowerCase().trim();
          if (!lang) continue;

          const blockStart = match.index;
          const blockEnd = blockStart + match[0].length;
          const codeStart = blockStart + match[1].length + 3;

          builder.add(
            blockStart, codeStart,
            import_view.Decoration.mark({class: "token code-block-delimiter"})
          );

          if (this.plugin.readyState.prism.languages && !this.plugin.readyState.prism.languages[lang]) {
            if (!this.plugin.supportedLanguages.has(lang) ||
                this.plugin.readyState.unsupportedLanguages.has(lang)) {
              builder.add(
                blockEnd - 3, blockEnd,
                import_view.Decoration.mark({class: "token code-block-delimiter"})
              );
              continue;
            }

            this.plugin._loadLanguage(lang)
              .then(success => {
                if (success) {
                  window.dispatchEvent(new CustomEvent('prism-language-loaded'));
                }
              });

            builder.add(
              blockEnd - 3, blockEnd,
              import_view.Decoration.mark({class: "token code-block-delimiter"})
            );
            continue;
          }

          if (this.plugin.readyState.prism.languages && this.plugin.readyState.prism.languages[lang]) {
            try {
              const code = text.substring(codeStart, blockEnd - 3);
              const tokens = this.plugin.readyState.prism.tokenize(
                code, this.plugin.readyState.prism.languages[lang]
              );

              this._processTokens(tokens, builder, codeStart);
            } catch (e) {
            }
          }

          builder.add(
            blockEnd - 3, blockEnd,
            import_view.Decoration.mark({class: "token code-block-delimiter"})
          );
        }

        return builder.finish();
      }

      _processTokens(tokens, builder, offset, pos = 0, parentClass = "") {
        tokens.forEach(token => {
          if (typeof token === 'string') {
            pos += token.length;
            return;
          }

          const tokenClass = parentClass
            ? `${parentClass} token ${token.type}`
            : `token ${token.type}`;

          if (typeof token.content === 'string') {
            builder.add(
              offset + pos,
              offset + pos + token.content.length,
              import_view.Decoration.mark({class: tokenClass})
            );
            pos += token.content.length;
          }
          else if (Array.isArray(token.content)) {
            token.content.forEach(subToken => {
              if (typeof subToken === 'string') {
                pos += subToken.length;
              } else {
                this._processTokens([subToken], builder, offset, pos, tokenClass);
              }
            });
          }
          else {
            this._processTokens([token.content], builder, offset, pos, tokenClass);
          }
        });
      }
    };
  }

  async _loadPrism() {
    if (window.PrismCDN) return window.PrismCDN;

    try {
      const response = await fetch("https://cdnjs.cloudflare.com/ajax/libs/prism/1.30.0/prism.min.js");
      if (!response.ok) throw new Error("CDN 로드 실패");

      const code = await response.text();
      const scope = {
        window: {},
        document: document,
        self: {},
        Prism: null
      };

      const prism = new Function('scope', `with(scope){${code}return Prism}`)(scope);

      if (!prism || !prism.languages) {
        throw new Error("유효하지 않은 Prism 인스턴스");
      }

      window.PrismCDN = prism;

      for (const lang in prism.languages) {
        this.readyState.loadedLanguages.add(lang);
      }

      return prism;
    } catch (e) {
      try {
        const obsidianPrism = await import_obsidian.loadPrism();

        if (!obsidianPrism || !obsidianPrism.languages) {
          throw new Error("유효하지 않은 Obsidian Prism");
        }

        for (const lang in obsidianPrism.languages) {
          this.readyState.loadedLanguages.add(lang);
        }

        return obsidianPrism;
      } catch (fallback) {
        console.error("Prism 로드 완전 실패:", fallback);
        throw fallback;
      }
    }
  }

  _processCodeBlocks(element) {
    if (!this.readyState.prism) return;

    element.querySelectorAll('pre > code').forEach(async block => {
      const match = /language-(\S+)/.exec(block.className);
      if (!match) return;

      const lang = match[1].toLowerCase().trim();
      if (!lang) return;

      try {
        if (this.readyState.prism.languages[lang]) {
          this.readyState.prism.highlightElement(block);
          return;
        }

        if (!this.supportedLanguages.has(lang) || this.readyState.unsupportedLanguages.has(lang)) {
          return;
        }

        if (await this._loadLanguage(lang)) {
          this.readyState.loadedLanguages.add(lang);
          this.readyState.prism.highlightElement(block);
        } else {
          this.readyState.unsupportedLanguages.add(lang);
        }
      } catch (e) {
        this.readyState.unsupportedLanguages.add(lang);
      }
    });
  }

  async _loadLanguage(lang) {
    if (!this.readyState.prism || !lang) return false;

    if (!this.supportedLanguages.has(lang) || this.readyState.unsupportedLanguages.has(lang)) {
      return false;
    }

    try {
      const url = `https://cdnjs.cloudflare.com/ajax/libs/prism/1.30.0/components/prism-${lang}.min.js`;
      const response = await fetch(url);
      if (!response.ok) {
        this.readyState.unsupportedLanguages.add(lang);
        throw new Error("언어 모듈 로드 실패");
      }

      const code = await response.text();
      new Function('Prism', code)(this.readyState.prism);
      return true;
    } catch (e) {
      try {
        return new Promise(resolve => {
          const script = document.createElement('script');
          script.src = `https://cdnjs.cloudflare.com/ajax/libs/prism/1.30.0/components/prism-${lang}.min.js`;
          script.async = true;

          script.onload = () => resolve(true);
          script.onerror = () => {
            this.readyState.unsupportedLanguages.add(lang);
            resolve(false);
          };

          document.head.appendChild(script);
        });
      } catch {
        this.readyState.unsupportedLanguages.add(lang);
        return false;
      }
    }
  }

  onunload() {}
}
