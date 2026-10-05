# Calathea Crimson: image-blaster dry run

Step 1 (the free analysis) is done: see `image.json`. Everything below is what the paid steps
**would** send. Nothing has been generated yet.

Source: `source/0-calathea-crimson.jpg`, cropped from a phone screenshot (590x738).

## Objects (confirmed 2026-10-05)

| id | make a 3D model? | why |
|---|---|---|
| `calathea-pink-blotch` | yes | left plant, liftable |
| `calathea-pink-stripe` | yes | right plant, liftable |
| `pine-board` | no (stays in the world) | the plants need a surface to sit on in the world |
| `wooden-crate` | no (stays in the world) | cut off by the frame edge, so a 3D model would be guesswork |

Pot and plant are kept together as one object, since you lift them as one unit. Confirmed: two
separate plants, plastic pots, no original photo (the 590x738 screenshot crop is the source).
`object.json` files are written under `output/<id>/`.

## Paid steps and call count

With 2 objects: 4 + 6x2 = **16 calls**
(1 plate + 1 world + 2 ambience + per object: 1 cut-out + 1 3D model + 4 impact sounds).

### 2. Clean plate (Nano Banana 2, 1 call)

```bash
node .claude/scripts/image-edit/generate-edit.mjs \
  --image "worlds/calathea-crimson/source/0-calathea-crimson.jpg" \
  --prompt "remove the following from the image: the two potted calathea plants in purple pots and the shadows they cast on the board, the circular PAROSTOK logo in the top-left corner, the 1/3 badge in the top-right corner, and the heart, comment and share icons with their numbers along the right edge" \
  --output-dir "worlds/calathea-crimson/source" \
  --role plate \
  --output-slug "calathea-crimson-plate"
```
Output: `source/1-calathea-crimson-plate.png`

### 3. World (World Labs Marble 1.1, 1 call)

The prompt is a text version of the clean plate: the scene with the plants removed.

```bash
node .claude/scripts/world/generate-world.mjs --world "calathea-crimson" --prompt "Empty light pine board with a dark knot and wavy grain and a raw front edge, resting on grey carpet in front of a dark charcoal wall with a fine stippled texture. A stacked light-wood crate on a black frame stands at the right edge. Small indoor product-photo setup viewed from slightly above at close range. Photorealistic, high contrast. Hard directional warm-white light from the front right, crisp shadows, dark falloff on the wall. Clear indoor air."
```
Outputs: `output/world/1-world-*.spz` (splats), `1-world.glb` (collider), panorama, thumbnail.

### 4. Objects (Nano Banana 2 cut-out -> Hunyuan3D v3, 2 calls each)

```bash
node .claude/scripts/asset-pipeline/generate-single-asset.mjs --world "calathea-crimson" \
  --object-id "calathea-pink-blotch" \
  --image-edit-prompt "Isolate the potted calathea on the left side of the board from this image. Reproduce it exactly as shown -- same colors, materials, and proportions: rounded leaves with bright magenta-pink centers and dark green margins, one solid dark burgundy leaf, burgundy undersides, in a glossy metallic purple tapered pot with a stepped rim and dark soil. White background, centered, tight crop, studio lighting. No other objects, no scene, no people, no text, no shadows on the ground. Isolate the object and remove all clustered, adjacent, overlapping, or items resting on the target object. Exclude the second potted plant on the right and the logo overlay. Create a clean render of that one single object that is true to the source image."

node .claude/scripts/asset-pipeline/generate-single-asset.mjs --world "calathea-crimson" \
  --object-id "calathea-pink-stripe" \
  --image-edit-prompt "Isolate the potted calathea on the right side of the board from this image. Reproduce it exactly as shown -- same colors, materials, and proportions: large rounded dark green-black leaves with thin magenta-pink stripes along the midrib and edges, burgundy undersides, a rolled new leaf at the center, in a glossy metallic purple tapered pot with a stepped rim and dark soil. White background, centered, tight crop, studio lighting. No other objects, no scene, no people, no text, no shadows on the ground. Isolate the object and remove all clustered, adjacent, overlapping, or items resting on the target object. Exclude the second potted plant on the left, the wooden crate, and the heart and comment icons overlapping the right leaves. Create a clean render of that one single object that is true to the source image."
```
Defaults: 50k faces, PBR on, `Normal`. Thin leaves are where image-to-3D tends to fail. To check
the cut-out first without paying for the 3D step, add `--reference-only`. To get crisper leaf
edges, consider `--face-count 200000`.

### 5. Sound (ElevenLabs SFX v2, 2 + 4x2 calls)

```bash
# world ambience: 2 loops, 10s each
node .claude/scripts/sfx/fal-elevenlabs-sfx.mjs --prompt "ambient environment, loop of quiet indoor room tone with a soft, steady background hush" \
  --output-dir "worlds/calathea-crimson/output/sfx" --prefix ambient-loop --count 2 --kind world-ambience --duration-seconds 10 --loop --postprocess true

# per object: 4 impact one-shots, 1s each
node .claude/scripts/sfx/fal-elevenlabs-sfx.mjs --prompt "impact one-shot, short-decay, small glossy purple plastic plant pot filled with soil and leafy foliage hitting a hard surface" \
  --output-dir "worlds/calathea-crimson/output/calathea-pink-blotch/sfx" --prefix impact-calathea-pink-blotch --count 4 --kind object-impact --duration-seconds 1 --postprocess true
# (same prompt again for calathea-pink-stripe, with its own output dir and prefix)
```

## Caveats for this source

- **Low resolution (590x738).** No original photo is available, so this caps the detail of the
  world and the models. Use `--reference-only` first to check the plant cut-outs before paying
  for the 3D step.
- **The photo is someone else's** (an Instagram shop post). That's fine for experimenting, but keep
  it in mind before sharing outputs.
