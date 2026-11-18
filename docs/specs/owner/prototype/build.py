"""Builds owner-command-centre.html (self-contained) from src.html + assets/*.webp. Run: python3 build.py"""
import base64, pathlib
here = pathlib.Path(__file__).parent
src = (here / 'src.html').read_text()
for key, f in {'LOGO': 'logo-mark', 'OWL_WAVE': 'owl-wave', 'OWL_BOTTLE': 'owl-bottle', 'OWL_READ': 'owl-read', 'OWL_SLEEP': 'owl-sleep'}.items():
    b64 = base64.b64encode((here / 'assets' / f'{f}.webp').read_bytes()).decode()
    src = src.replace(f'%%{key}%%', f'data:image/webp;base64,{b64}')
(here / 'owner-command-centre.html').write_text(src)
print('built', len(src) // 1024, 'KB')
