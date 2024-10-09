# marked-more-lists

This extension for the [marked](https://marked.js.org/) library adds support for rendering ordered lists with various
`type` attributes. It allows Markdown lists that start with `a.`, `A.`, `i.`, `I.`, and other patterns to be rendered
as `<ol>` elements with corresponding `type` values (e.g., `<ol type="a">`).

It also adds support for lists that start with a custom value or that skips values, by using the `value` attribute on
the list item.

This enables more flexible list formatting in Markdown, enhancing the output to match the intended ordering style.

# Usage

```js
import {marked} from "marked";
import markedMoreLists from "marked-more-lists";

// or UMD script
// <script src="https://cdn.jsdelivr.net/npm/marked/lib/marked.umd.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/marked-more-lists/lib/index.umd.js"></script>

marked.use(markedMoreLists());

const exampleMarkdown = `
1. item 1
2. item 2
    a. item 2a
	    I.  sub item I
	    II. sub item II
    e. item 2e
7. item 7
`;

marked.parse(exampleMarkdown);
// <ol>
//   <li>item 1</li>
//   <li>item 2
//     <ol type="a">
//       <li>item 2a</li>
//       <ol type="I">
//         <li>sub item I</li>
//         <li>sub item II</li>
//       </ol>
//       <li value="5">item 2e</li>
//     </ol>
//   </li>
//   <li value="7">item 7</li>
// </ol>
```
