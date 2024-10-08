import { marked } from 'marked';
import markedMoreLists from '../src/index.js';

function cleanHtml(html) {
  return html.replace(/([^\n\s])</g, '$1\n<').split('\n').map((line) => line.trim()).join('\n').trim();
}

describe('marked-more-lists', () => {
  const exampleMarkdown = `
1. item 1
2. item 2
    a. item 2a
        I. sub item I
        II. sub item II
    x. item 2x
7. item 7
`;

  const expectedResult = `
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
      <li value="24">item 2x</li>
    </ol>
  </li>
  <li value="7">item 7</li>
</ol>
    `;

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
});
