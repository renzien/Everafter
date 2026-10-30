from pathlib import Path
import urllib.request, re, math, wave, array, random

root = Path(__file__).parent / 'public' / 'assets'
font_sets = [
    ('dm-sans.ttf', 'DM+Sans:wght@100..900'),
    ('cormorant.ttf', 'Cormorant+Garamond:wght@300..700'),
    ('cormorant-italic.ttf', 'Cormorant+Garamond:ital,wght@1,300..700'),
]
for filename, family in font_sets:
    request = urllib.request.Request('https://fonts.googleapis.com/css2?family=' + family + '&display=swap', headers={'User-Agent': 'Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36'})
    css = urllib.request.urlopen(request).read().decode()
    url = re.findall(r'url\((https:[^)]+)\)', css)[-1]
    (root / filename).write_bytes(urllib.request.urlopen(url).read())
    print(filename, (root / filename).stat().st_size)

# Three original, gently voiced piano studies, rendered locally.
rate, duration = 22050, 32
tracks = {
    'little-forever': ([48, 55, 60, 64, 52, 59, 64, 67, 45, 52, 57, 60, 53, 60, 65, 69], [72, 76, 79, 76, 74, 71, 67, 71, 72, 76, 81, 79, 77, 76, 72, 69]),
    'golden-hour': ([50, 57, 62, 66, 47, 54, 59, 62, 43, 50, 55, 59, 45, 52, 57, 61], [74, 78, 81, 78, 76, 74, 71, 69, 71, 74, 78, 79, 76, 73, 69, 74]),
    'garden-waltz': ([53, 60, 65, 69, 50, 57, 62, 65, 46, 53, 58, 62, 48, 55, 60, 64], [77, 81, 84, 81, 79, 77, 74, 72, 74, 77, 81, 82, 79, 76, 72, 77]),
}
for name, (chords, melody) in tracks.items():
    buffer = [0.0] * (rate * duration)
    def note(midi, start, velocity, length=3.7):
        frequency = 440 * 2 ** ((midi - 69) / 12)
        first = int(start * rate)
        total = min(int(length * rate), len(buffer) - first)
        for i in range(total):
            t = i / rate
            envelope = min(1, t / .012) * math.exp(-t * 1.5) * min(1, (length - t) / .24)
            sound = (math.sin(2 * math.pi * frequency * t) + .27 * math.sin(2 * math.pi * frequency * 2.002 * t) * math.exp(-t * 1.8) + .09 * math.sin(2 * math.pi * frequency * 3.006 * t) * math.exp(-t * 3))
            buffer[first+i] += sound * envelope * velocity
    for i in range(64):
        note(chords[i % 16], i * .5, .19 if i % 4 == 0 else .105)
    for i in range(32):
        note(melody[i % 16], i * 1 + .03, .125, 3.1)
    delay = int(.23 * rate)
    for i in range(delay, len(buffer)):
        buffer[i] += buffer[i-delay] * .11
    peak = max(abs(x) for x in buffer)
    pcm = array.array('h', (int(max(-1, min(1, x / peak * .7)) * 32767 * min(1, i / rate / .15, (duration-i/rate)/1.7)) for i, x in enumerate(buffer)))
    with wave.open(str(root / (name + '.wav')), 'wb') as output:
        output.setparams((1, 2, rate, 0, 'NONE', 'not compressed'))
        output.writeframes(pcm.tobytes())
    print(name + '.wav')
