#!/usr/bin/env python3
"""
Regenerate the FAQPage structured data on contact.html from the FAQ markup
that is actually on the page.

Google requires the schema to match the visible content, so this reads the
<details class="faq"> blocks rather than keeping a second copy by hand. Run it
after editing any FAQ answer:

    python3 tools/build-faq-schema.py
"""
import html, json, pathlib, re, sys

PAGE = pathlib.Path(__file__).resolve().parent.parent / 'contact.html'
START, END = '<!--FAQ-SCHEMA:start-->', '<!--FAQ-SCHEMA:end-->'


def text_of(fragment):
    """Visible text of an HTML fragment, entities resolved, spacing tidied."""
    t = re.sub(r'<[^>]+>', '', fragment)
    return re.sub(r'\s+', ' ', html.unescape(t)).strip()


def main():
    src = PAGE.read_text()

    qas = []
    for block in re.findall(r'<details class="faq">(.*?)</details>', src, re.S):
        q = re.search(r'<summary>(.*?)</summary>', block, re.S)
        a = re.search(r'</summary>\s*(.*)$', block, re.S)
        if not (q and a):
            continue
        qas.append({
            "@type": "Question",
            "name": text_of(q.group(1)),
            "acceptedAnswer": {"@type": "Answer", "text": text_of(a.group(1))},
        })

    if not qas:
        sys.exit('no FAQ blocks found on contact.html')

    payload = json.dumps(
        {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": qas},
        indent=2, ensure_ascii=False)
    block = (f'{START}\n<script type="application/ld+json">\n'
             f'{payload}\n</script>\n{END}')

    if START in src:
        src = re.sub(re.escape(START) + r'.*?' + re.escape(END),
                     lambda _: block, src, flags=re.S)
    else:
        src = src.replace('</head>', block + '\n</head>', 1)

    PAGE.write_text(src)
    print(f'contact.html: FAQPage schema written, {len(qas)} questions')


if __name__ == '__main__':
    main()
