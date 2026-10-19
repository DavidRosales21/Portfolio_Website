# Share images (Open Graph, 1200×630)

`og-en.html` → `public/og-default.png` · `og-es.html` → `public/og-es.png` (design.md, direction A · Blueprint).
Edit the text in the HTML, then render with Chrome from this folder:

```
chrome --headless=new --hide-scrollbars --allow-file-access-from-files --window-size=1200,630 --screenshot=../../public/og-default.png og-en.html
chrome --headless=new --hide-scrollbars --allow-file-access-from-files --window-size=1200,630 --screenshot=../../public/og-es.png og-es.html
```
