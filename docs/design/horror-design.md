# Horror Design (Jump Scares and Sounds)

## 1. Principles

- **Build tension, then release it.** Quiet → small noises → something wrong → scare → short calm.
- **Scare Director** controls pacing: at most **one big jump scare every ~4–6 minutes**, with small scares in between. Never fire during a note-reading or puzzle UI.
- **Each player gets different scares** sometimes, so one sees something the other didn't ("Did you see that?!").
- **Use the partner:** fake partner footsteps, a fake partner figure at the end of a hall, the radio using the partner's name.
- Scares are **triggered** (trigger tiles in the map) or **directed** (Scare Director picks one when tension is high and nothing has happened for a while).

## 2. Jump scare catalog

| ID | Scare | How it works in code | Night |
| --- | --- | --- | --- |
| JS-01 | Face in the flashlight | Pale face mesh pops in front of the camera for 0.4 s + scream sting + camera shake | 1+ |
| JS-02 | Door slam | Open door snaps shut behind the player + loud slam + all lights cut for 1 s | 1+ |
| JS-03 | Lights out, figure appears | Blackout 2 s; when lights return, The Waiting One stands 3 m away (it does not move yet) | 2+ |
| JS-04 | Falling books / object | Physics-free tween of a shelf object falling + crash sound right beside the player | 2 |
| JS-05 | Fake partner | Partner-shaped figure at the end of a hallway; walks into a wall and vanishes. Real partner is elsewhere | 3+ |
| JS-06 | Window hand | Hand slams the window with a bang as the player passes | 1, 4 |
| JS-07 | Behind you | Breathing sound pans behind the player; turning around shows The Waiting One for 1 frame | 4+ |
| JS-08 | Radio scream | Radio static rises, then a distorted scream through the radio | 4 |
| JS-09 | Mirror | Mirror reflection shows a figure behind the player that is not there | 2, 5 |
| JS-10 | Final chase | The Waiting One stops freezing; fast music + heartbeat; run to the exit | 5 |

## 3. Sound catalog (all generated with Web Audio API)

| Sound | Technique |
| --- | --- |
| Ambient drone | 2–3 detuned sawtooth oscillators through a low-pass filter (~180 Hz), slow LFO on volume |
| Footsteps | Short bandpass-filtered noise bursts, pitch varies per step; different filter per floor type |
| Knocks | Low bandpass noise (90 Hz), 3 hits, panned to a random direction |
| Door creak | Sawtooth with slow frequency sweep + resonant bandpass + noise |
| Door slam | Loud low noise burst + short reverb tail (ConvolverNode with generated impulse) |
| Whispers | Noise through several narrow bandpass filters that move like vowels; panned in 3D |
| Breathing | Filtered noise with slow in/out volume envelope, PannerNode placed behind the player |
| Heartbeat | Two low sine thumps; rate rises as The Waiting One gets closer |
| Scream sting | Detuned sawtooth glide down + noise burst + distortion (WaveShaperNode) |
| Radio static | White noise through bandpass + random crackle bursts |
| Music box | Sine notes with slight detune, slowed and out of tune |
| Low "it saw you" tone | Very low sine (40 Hz) swell when The Waiting One freezes in view |

**3D audio:** use `PannerNode` (HRTF) for anything placed in the world so headphone users can hear direction.

## 4. Safety settings

- Master volume + separate scare-sting volume
- **Reduce flashing** toggle (removes rapid light flicker; jump scares stay)
- Subtitles for important audio cues ("[knocking upstairs]")
- Content warning on the title screen
