# FlyLab

Experimental Minecraft bot controlled by a fixed fly-connectome simulation, adapted from [DOOMFLY](https://github.com/nftechie/doomfly). Includes a lightweight phone viewer suitable for a Cloudflare Tunnel.

**It walks, turns and can perform restricted neural-triggered interactions. It does not learn, build, plan, or understand Minecraft.** Connectivity comes from reconstructed MaleCNS data; neuron dynamics, visual input and motor mappings are approximations. Movement is not evidence of intelligence or biological fidelity.

## How it works

Loaded blocks → 64×48 RGB camera → inferred retinal inputs → fixed native LIF simulation → bounded walking/turning pulses.

- 166,700 retained neurons and 25,582,938 directed connections in the pinned upstream graph.
- 50 ms of simulated neural time per step, with no training or plasticity.
- DNp20 activity maps to turning; DNpe017 maps to forward movement. The BCI attack output (also derived from DNpe017 spikes) triggers restricted interactions.
- Separate 256×192 viewer frames add procedural surface detail every three steps without changing the neural input.
- The camera approximates solid blocks as cubes. It does not render entities or official textures.
- Game physics advances in real time; neural and game time are not synchronized.

## Setup

Requires Node.js, Python 3.11, a C++ compiler, and several GB of RAM and free storage. A local Paper test server additionally needs compatible Java. No model API key is required.

Clone DOOMFLY alongside this repository under the directory name `minecraft-flybrain`:

```sh
git clone https://github.com/nftechie/doomfly ../minecraft-flybrain
git -C ../minecraft-flybrain checkout 71ecf53d78eaffaf1a57ed7b0ccf5d458abc9f33
python3.11 -m venv ../minecraft-flybrain/.venv
../minecraft-flybrain/.venv/bin/pip install -r requirements.txt
npm ci
../minecraft-flybrain/.venv/bin/python prepare_brain.py
```

Preparation downloads approximately 1.1 GB of upstream checksum-locked data and builds the native graph/kernel. Data and binaries are not included in this repository.

## Connect to your own test server

Use a disposable enclosed arena with its floor at Y=100. Start the bot with:

```sh
MC_LIVE=1 MC_HOST=localhost MC_PORT=25565 FRAMES=0 node bot.js
```

`MC_USERNAME` and `MC_AUTH` override the default bot name and Mineflayer authentication mode. The default is offline authentication for a controlled test server. Use `MC_AUTH=microsoft` for a server requiring an authenticated Java account.

Before each connection, remove any stale `run/live-ready` file. When the bot reports `BOT_CONNECTED_WAITING_FOR_ARENA`, authenticate it if your server requires this, place it safely inside the arena at Y=101, and create `run/live-ready` within 60 seconds. The bot refuses to start below the arena. Never grant it operator permissions. Use Ctrl-C to stop; there is no automatic reconnect.

`FRAMES=0` runs continuously; otherwise it stops after that many neural steps (default 40). Logs and generated camera frames are written under ignored `run/`.

### Optional disposable local arena

Put an official compatible Paper jar at `test-server/paper.jar`, accept its EULA yourself, and configure that test server with `server-ip=127.0.0.1`, `server-port=25586`, and `online-mode=false`. Then run:

```sh
FRAMES=80 ../minecraft-flybrain/.venv/bin/python run_local.py
```

The launcher rebuilds the arena each time and stops the test server afterwards. Never point it at a valuable world. `JAVA` can override the Java executable. The original integration was tested against Paper 26.1.2; other versions are not verified.

## Phone viewer / Cloudflare

While the bot runs, launch:

```sh
../minecraft-flybrain/.venv/bin/python viewer_feed.py
cloudflared tunnel --url http://127.0.0.1:8768
```

Open the returned HTTPS tunnel URL with `/#YOUR_TOKEN` appended. The generated token is in `run/viewer-secret`; keep the resulting link private. The page stores it in session storage and removes the fragment from the address bar. Snapshots require bearer authentication; the page itself is a public shell. This is a read-only viewer, not a remote control panel. A quick tunnel is temporary, and the host computer must remain awake.

The viewer polls every 250 ms; fresh image cadence depends on simulation and rendering speed. This is a sequence of rendered snapshots, not a Minecraft video stream.

## Tests

```sh
npm test
../minecraft-flybrain/.venv/bin/python -m pytest test_retina.py test_neural.py -q
```

Checks cover ray intersections, changing-view pixels, bounded controls, retinal interpolation and silent-neuron controls. These do not validate useful navigation or learning.

## Attribution

See [THIRD_PARTY.md](THIRD_PARTY.md) and [DOOMFLY-LICENSE.txt](DOOMFLY-LICENSE.txt). Upstream engine/data are acquired separately and retain their respective terms. This project is not affiliated with Mojang or the connectome authors.

## Restricted interactions

On startup, the adapter equips a diamond pickaxe if one exists in its inventory. This is a scripted helper, not learned equipment selection.

In live mode, interactions are enabled only in `minecraft:flylab`. Mining is restricted to clay at X/Z −14…14 and Y 101…104, within three blocks. Combat is restricted to slimes in those bounds with a one-second cooldown; players and pets are excluded. Normal-world interactions remain disabled.

A neural attack signal starts a dig. Movement and neural stepping pause until that dig completes or the 2.5-second timeout cancels it. This scripted action hold avoids turning away midway; it is not learned persistence. The explicit block raycast handles level camera angles, which the dependency's cursor helper incorrectly rejects. Live clay removal was verified against server block state; live mob combat has not been verified.

For Adventure-mode tests, provide a pickaxe with a clay-only `can_break` component appropriate to your server version. The adapter does not grant items or permissions itself. Use disposable blocks inside the test arena.

## Expanded live activity viewer

The viewer includes a fixed sample of 512 neurons, selected evenly across model indices, plus the 14 monitored motor outputs. Each square shows actual spike counts for the latest 50 ms of simulated time; tap it for its neuron ID. The grid is not an anatomical map. A full-model counter reports the number of neurons with nonzero spikes in that step. Only sampled telemetry is displayed; browser polling can skip simulation steps.

Additional scripted movement mappings enable sprinting at high forward drive, a grounded jump on an attack signal with a one-second cooldown, and upward swimming while forward drive is active in water. These are game-control mappings, not learned behaviour. Live mining and combat remain restricted to the test world.
