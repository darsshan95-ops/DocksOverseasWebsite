#!/bin/sh
# Injects the shared SVG sprite and footer into every page.
# Run after editing partials/sprite.html or partials/footer.html:
#   sh build.sh
set -e
cd "$(dirname "$0")"

for page in index.html produce.html about.html contact.html; do
  python3 - "$page" <<'PY'
import re, sys, pathlib
page = pathlib.Path(sys.argv[1])
html = page.read_text()
sprite = pathlib.Path('partials/sprite.html').read_text().strip()
footer = pathlib.Path('partials/footer.html').read_text().strip()

def swap(src, name, payload):
    start, end = f'<!--{name}:start-->', f'<!--{name}:end-->'
    block = f'{start}\n{payload}\n{end}'
    if start in src:
        return re.sub(re.escape(start) + r'.*?' + re.escape(end), lambda _: block, src, flags=re.S)
    return src.replace(f'<!--{name}-->', block)

html = swap(html, 'SPRITE', sprite)
html = swap(html, 'FOOTER', footer)
page.write_text(html)
print(f'  built {page}')
PY
done
echo "done."
