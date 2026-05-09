import { marked } from 'marked';
import markedMoreLists from '../src/index.js';

function cleanHtml(html) {
  return html.replace(/([^\n\s])</g, '$1\n<').split('\n').map((line) => line.trim()).join('\n').trim();
}

describe('marked-more-lists', () => {
  const exampleMarkdown = `
look at the following list:
  
1. item 1
2. item 2
    a. item 2a
        I. sub item I
        II. sub item II
    e. item 2e
        i) sub item i
        iv) sub item iv
7. item 7
    B) item B
    D) item D
8. item 8
    - foo
    - bar
`;

  const expectedResult = `
<p>look at the following list:</p>
<ol>
  <li>item 1</li>
  <li>item 2
    <ol type="a">
      <li>item 2a
        <ol type="I">
          <li>sub item I</li>
          <li>sub item II</li>
        </ol>
      </li>
      <li value="5">item 2e
        <ol type="i">
          <li>sub item i</li>
          <li value="4">sub item iv</li>
        </ol>
      </li>
    </ol>
  </li>
  <li value="7">item 7
      <ol start="2" type="A">
        <li value="2">item B</li>
        <li value="4">item D</li>
      </ol>
  </li>
  <li>item 8
      <ul>
        <li>foo</li>
        <li>bar</li>
      </ul>
  </li>
</ol>`;

  beforeEach(() => {
    marked.setOptions(marked.getDefaults());
  });

  test('with extension', () => {
    marked.use(markedMoreLists());

    const result = marked(exampleMarkdown);
    expect(cleanHtml(result)).toBe(cleanHtml(expectedResult));
  });

  test('without this extension', () => {
    const result = marked(exampleMarkdown);
    expect(cleanHtml(result)).not.toBe(cleanHtml(expectedResult));
  });

  describe('start attribute tests', () => {
    beforeEach(() => {
      marked.setOptions(marked.getDefaults());
      marked.use(markedMoreLists());
    });

    test('numeric list starting at 1 has no start attribute', () => {
      const result = marked.parse('1. First\n2. Second');
      expect(result).not.toContain('start=');
    });

    test('numeric list starting at 5 has start="5"', () => {
      const result = marked.parse('5. Fifth\n6. Sixth');
      expect(result).toContain('start="5"');
    });

    test('alphabetic list starting at e has start="5"', () => {
      const result = marked.parse('e. Fifth\nf. Sixth');
      expect(result).toContain('start="5"');
      expect(result).toContain('type="a"');
    });

    test('Roman numeral list starting at v has start="5"', () => {
      const result = marked.parse('v. Fifth\nvi. Sixth');
      expect(result).toContain('start="5"');
      expect(result).toContain('type="i"');
    });

    test('no start="undefined" in output', () => {
      const result = marked.parse('1. First\na. Alpha\ni. Roman');
      expect(result).not.toContain('start="undefined"');
      expect(result).not.toContain('start="null"');
    });
  });
});
