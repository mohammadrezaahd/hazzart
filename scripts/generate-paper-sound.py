"""Deterministic original paper-on-table foley. No third-party recording."""
import math
import random
import struct
import wave
from pathlib import Path

rng = random.Random(19)
rate = 44100
samples = []
low = 0.0
for index in range(int(rate * 0.27)):
    t = index / rate
    noise = rng.uniform(-1, 1)
    low = low * 0.82 + noise * 0.18
    rustle = (noise - low) * math.exp(-t * 24) * 0.11
    thump = math.sin(2 * math.pi * 115 * t) * math.exp(-t * 55) * 0.24
    envelope = min(1, t / 0.003) * min(1, (0.27 - t) / 0.025)
    samples.append(struct.pack('<h', int((rustle + thump) * envelope * 32767)))
path = Path(__file__).resolve().parent.parent / 'public/audio/paper-drop.wav'
with wave.open(str(path), 'wb') as output:
    output.setparams((1, 2, rate, 0, 'NONE', 'not compressed'))
    output.writeframes(b''.join(samples))
