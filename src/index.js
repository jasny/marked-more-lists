function letterToInt(letter) {
  return letter.toLowerCase().charCodeAt(0) - 96;
}

function romanToInt(roman) {
  const romanMap = {
    I: 1,
    V: 5,
    X: 10,
    L: 50,
    C: 100,
    D: 500,
    M: 1000,
  };

  roman = roman.toUpperCase();
  let total = 0;

  for (let i = 0; i < roman.length; i++) {
    const current = romanMap[roman[i]];
    const next = romanMap[roman[i + 1]];

    if (next && current < next) {
      total -= current;
    } else {
      total += current;
    }
  }

  return total;
}

const romanUpper = '(?:C|XC|L?X{0,3}(?:IX|IV|V?I{0,3}))';
const romanLower = '(?:c|xc|l?x{0,3}(?:ix|iv|v?i{0,3}))';
const bulletPattern = `(?:[*+-]|(?:\\d{1,9}|[a-zA-Z]|${romanUpper}|${romanLower})[.)]))`;
const rule = `^( {0,3}${bulletPattern}([ \\t][^\\n]+?)?(?:\\n|$)`;

export default function() {
  return {
    name: 'marked-more-lists',
    level: 'block',
    tokenizer: {
      list(src) {
        let cap = new RegExp(rule).exec(src);

        if (cap) {
          let bullet = cap[1].trim();
          const isordered = bullet !== '*' && bullet !== '-' && bullet !== '+';
          let bull;
          let type = '';
          let expectedValue = 1;

          if (isordered && bullet.match(new RegExp(`^${romanUpper}[.)]$`))) {
            type = 'I';
            bull = `${romanUpper}\\${bullet.slice(-1)}`;
          } else if (isordered && bullet.match(new RegExp(`^${romanLower}[.)]$`))) {
            type = 'i';
            bull = `${romanLower}\\${bullet.slice(-1)}`;
          } else if (isordered && bullet.match(/^[a-z][.)]$/)) {
            type = 'a';
            bull = `[a-z]\\${bullet.slice(-1)}`;
          } else if (isordered && bullet.match(/^[A-Z][.)]$/)) {
            type = 'A';
            bull = `[A-Z]\\${bullet.slice(-1)}`;
          } else if (isordered) {
            type = '1';
            bull = `\\d{1,9}\\${bullet.slice(-1)}`;
          } else {
            bull = this.options.pedantic ? bullet : '[*+-]';
          }

          const list = {
            type: 'list',
            raw: '',
            ordered: isordered,
            listType: type,
            loose: false,
            items: [],
          };

          // Get next list item
          const itemRegex = new RegExp(`^( {0,3}${bull})((?:[\t ][^\\n]*)?(?:\\n|$))`);
          let endsWithBlankLine = false;
          // Check if current bullet point can start a new List Item
          while (src) {
            let endEarly = false;
            let raw = '';
            let itemContents = '';
            if (!(cap = itemRegex.exec(src))) {
              break;
            }

            if (this.rules.block.hr.test(src)) { // End list if bullet was actually HR (possibly move into itemRegex?)
              break;
            }

            raw = cap[0];
            bullet = cap[1].trim();
            src = src.substring(raw.length);

            let line = cap[2].split('\n', 1)[0].replace(/^\t+/, (t) => ' '.repeat(3 * t.length));
            let nextLine = src.split('\n', 1)[0];
            let blankLine = !line.trim();

            let indent = 0;
            if (this.options.pedantic) {
              indent = 2;
              itemContents = line.trimStart();
            } else if (blankLine) {
              indent = cap[1].length + 1;
            } else {
              indent = cap[2].search(/[^ ]/); // Find first non-space char
              indent = indent > 4 ? 1 : indent; // Treat indented code blocks (> 4 spaces) as having only 1 indent
              itemContents = line.slice(indent);
              indent += cap[1].length;
            }

            if (blankLine && /^[ \t]*$/.test(nextLine)) { // Items begin with at most one blank line
              raw += nextLine + '\n';
              src = src.substring(nextLine.length + 1);
              endEarly = true;
            }

            if (!endEarly) {
              const nextBulletRegex = new RegExp(`^ {0,${Math.min(3, indent - 1)}}(?:[*+-]|(?:\\d{1,9}|[a-zA-Z]|${romanUpper}|${romanLower})[.)])((?:[ \t][^\\n]*)?(?:\\n|$))`);
              const hrRegex = new RegExp(`^ {0,${Math.min(3, indent - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`);
              const fencesBeginRegex = new RegExp(`^ {0,${Math.min(3, indent - 1)}}(?:\`\`\`|~~~)`);
              const headingBeginRegex = new RegExp(`^ {0,${Math.min(3, indent - 1)}}#`);
              const htmlBeginRegex = new RegExp(`^ {0,${Math.min(3, indent - 1)}}<[a-z].*>`, 'i');

              // Check if following lines should be included in List Item
              while (src) {
                const rawLine = src.split('\n', 1)[0];
                let nextLineWithoutTabs;
                nextLine = rawLine;

                // Re-align to follow commonmark nesting rules
                if (this.options.pedantic) {
                  nextLine = nextLine.replace(/^ {1,4}(?=( {4})*[^ ])/g, '  ');
                  nextLineWithoutTabs = nextLine;
                } else {
                  nextLineWithoutTabs = nextLine.replace(/\t/g, '    ');
                }

                // End list item if found code fences
                if (fencesBeginRegex.test(nextLine)) {
                  break;
                }

                // End list item if found start of new heading
                if (headingBeginRegex.test(nextLine)) {
                  break;
                }

                // End list item if found start of html block
                if (htmlBeginRegex.test(nextLine)) {
                  break;
                }

                // End list item if found start of new bullet
                if (nextBulletRegex.test(nextLine)) {
                  break;
                }

                // Horizontal rule found
                if (hrRegex.test(nextLine)) {
                  break;
                }

                if (nextLineWithoutTabs.search(/[^ ]/) >= indent || !nextLine.trim()) { // Dedent if possible
                  itemContents += '\n' + nextLineWithoutTabs.slice(indent);
                } else {
                  // not enough indentation
                  if (blankLine) {
                    break;
                  }

                  // paragraph continuation unless last line was a different block level element
                  if (line.replace(/\t/g, '    ').search(/[^ ]/) >= 4) { // indented code block
                    break;
                  }
                  if (fencesBeginRegex.test(line)) {
                    break;
                  }
                  if (headingBeginRegex.test(line)) {
                    break;
                  }
                  if (hrRegex.test(line)) {
                    break;
                  }

                  itemContents += '\n' + nextLine;
                }

                if (!blankLine && !nextLine.trim()) { // Check if current line is blank
                  blankLine = true;
                }

                raw += rawLine + '\n';
                src = src.substring(rawLine.length + 1);
                line = nextLineWithoutTabs.slice(indent);
              }
            }

            if (!list.loose) {
              // If the previous item ended with a blank line, the list is loose
              if (endsWithBlankLine) {
                list.loose = true;
              } else if (/\n[ \t]*\n[ \t]*$/.test(raw)) {
                endsWithBlankLine = true;
              }
            }

            let istask = null;
            let ischecked;
            // Check for task list items
            if (this.options.gfm) {
              istask = /^\[[ xX]] /.exec(itemContents);
              if (istask) {
                ischecked = istask[0] !== '[ ] ';
                itemContents = itemContents.replace(/^\[[ xX]] +/, '');
              }
            }

            let value = null;
            if (!isordered) {
              // nop
            } else if (type === '1') {
              value = parseInt(bullet.slice(0, -1), 10);
            } else if (type === 'a' || type === 'A') {
              value = letterToInt(bullet.slice(0, -1));
            } else if (type === 'i' || type === 'I') {
              value = romanToInt(bullet.slice(0, -1));
            }

            list.items.push({
              type: 'list_item',
              raw,
              task: !!istask,
              checked: ischecked,
              loose: false,
              text: itemContents,
              value,
              skipped: isordered && value !== expectedValue,
              tokens: [],
            });

            expectedValue = value + 1;

            list.raw += raw;
          }

          // Do not consume newlines at end of final item. Alternatively, make itemRegex *start* with any newlines to simplify/speed up endsWithBlankLine logic
          list.items[list.items.length - 1].raw = list.items[list.items.length - 1].raw.trimEnd();
          list.items[list.items.length - 1].text = list.items[list.items.length - 1].text.trimEnd();
          list.raw = list.raw.trimEnd();

          // Item child tokens handled here at end because we needed to have the final item to trim it first
          for (let i = 0; i < list.items.length; i++) {
            this.lexer.state.top = false;
            list.items[i].tokens = this.lexer.blockTokens(list.items[i].text, []);

            if (!list.loose) {
              // Check if list should be loose
              const spacers = list.items[i].tokens.filter(t => t.type === 'space');
              list.loose = spacers.length > 0 && spacers.some(t => /\n.*\n/.test(t.raw));
            }
          }

          // Set all items to loose if list is loose
          if (list.loose) {
            for (let i = 0; i < list.items.length; i++) {
              list.items[i].loose = true;
            }
          }

          return list;
        }
      },
    },
    renderer: {
      list(token) {
        const ordered = token.ordered;
        const listType = token.listType;

        let body = '';
        for (let j = 0; j < token.items.length; j++) {
          const item = token.items[j];
          body += this.listitem(item);
        }

        const type = ordered ? 'ol' : 'ul';
        const typeAttr = (ordered && listType !== '1') ? (' type="' + listType + '"') : '';
        return '<' + type + typeAttr + '>\n' + body + '</' + type + '>\n';
      },
      listitem(item) {
        let itemBody = '';
        if (item.task) {
          const checkbox = this.checkbox({ checked: !!item.checked });
          if (item.loose) {
            if (item.tokens.length > 0 && item.tokens[0].type === 'paragraph') {
              item.tokens[0].text = checkbox + ' ' + item.tokens[0].text;
              if (item.tokens[0].tokens && item.tokens[0].tokens.length > 0 && item.tokens[0].tokens[0].type === 'text') {
                item.tokens[0].tokens[0].text = checkbox + ' ' + item.tokens[0].tokens[0].text;
              }
            } else {
              item.tokens.unshift({
                type: 'text',
                raw: checkbox + ' ',
                text: checkbox + ' ',
              });
            }
          } else {
            itemBody += checkbox + ' ';
          }
        }

        itemBody += this.parser.parse(item.tokens, !!item.loose);

        const valueAttr = item.skipped ? (' value="' + item.value + '"') : '';

        return `<li${valueAttr}>${itemBody}</li>\n`;
      },
    },
  };
}
