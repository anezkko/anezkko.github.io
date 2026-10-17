# Recording the dictionary words

Each of the 12 street-dictionary words can get a **Hear it** button with your own voice. There are no synthetic
voices on ZID, so a button only shows up once you've recorded the word.

## Record

- Use a phone's voice-memo app in a quiet room, with soft things around you (a bedroom is better than a
  bathroom). Hold the phone about 20 cm from your mouth, a little off to the side so you don't puff into it.
- Say each word **once**, naturally, the way you'd say it to a friend. Leave half a second of quiet before and after.
- Then say the example sentence too, if you like, in a separate take (not used yet, but nice to have).
- Words and file names:

| Word | File |
|---|---|
| Polahko | `polahko.mp3` |
| Jarane | `jarane.mp3` |
| Raja | `raja.mp3` |
| Bolan | `bolan.mp3` |
| Aferim | `aferim.mp3` |
| Džaba | `dzaba.mp3` |
| Ćejf | `cejf.mp3` |
| Merak | `merak.mp3` |
| Haman | `haman.mp3` |
| Kontaš? | `kontas.mp3` |
| Bujrum | `bujrum.mp3` |
| Sevdah | `sevdah.mp3` |

## Prepare (or ask Claude to do it)

Trim the silence, make it mono, even out the loudness and keep it small (each file should be well under 30 KB):

```
ffmpeg -i polahko.m4a -af "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,loudnorm=I=-16:TP=-1.5" -ac 1 -ar 44100 -b:a 64k polahko.mp3
```

## Publish

1. Put the files in `audio/words/`.
2. List their names in `data/words.json`, e.g. `"recorded": ["polahko", "jarane"]`.
3. Open a PR as usual. The buttons appear by themselves; no code changes needed.
