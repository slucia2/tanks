# Tanks vs. Cats

A top-down tank battler inspired by the classic living-room tanks game — except
every enemy tank is piloted by a cat.

## Play

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Objective

Survive nine levels and destroy every cat-driven tank. Standard shells ricochet
once and orange rockets ricochet twice, so bank shots around cover — and mind
your own bounce-backs, because
any shell (yours or theirs) can wreck any tank.

## Controls

Desktop:
- `W A S D` — drive
- Mouse — aim the turret
- Left click — fire a shell (max 5 on screen, ricochets once)
- `Space` or right click — lob a yarn ball; nearby cats abandon their tanks to play with it
- `P` — pause
- `R` — restart after a mission

Mobile / touch:
- Left stick — drag to drive (turret auto-aims the nearest cat tank)
- **FIRE** — hold to shoot
- **YARN** — tap to distract
- **II / ▶** — pause / resume

## Rules

- Your tank is destroyed in one hit. You have three lives total; losing one
  restarts the current level.
- Click the **LIVES** pill to toggle unlimited-lives mode. Death still restarts
  the current level, but no life is consumed.
- Every three kills refills one yarn ball (up to three).

## Scoring

End-of-run score rewards waves cleared, kills, and a fast clear; deaths subtract.
Enter 3 arcade initials to save a high score on **this device** (`localStorage`).
Unlimited-lives / practice runs show a score but **cannot** be saved to the board.

## Enemy types

- **Chaser (blue-gray cat)** — the standard blue tank introduced in Level 1;
  takes **1 hit** and fires bouncing shells.
- **Dasher (calico)** — cream-and-orange fast tank introduced in Level 2;
  takes **1 hit** and fires quick straight shells.
- **Rook (orange tabby)** — stationary orange rocket tank introduced later;
  takes **2 hits** and rapidly fires longer-lived, faster rockets with extended
  flame trails that ricochet twice. It selects open firing pads and can launch
  across the map even without direct line of sight.
- **Bruiser (void cat)** — very fast black hunter; takes **1 hit**, uses
  wall-aware pursuit to actively chase the player, and fires regular shells
  even while nearly invisible. It cloaks almost immediately for 2–3 seconds,
  but yarn forces it to reveal itself.

Enemy shots do not consume a ricochet when bouncing from the outer arena edge,
and cats are protected from their own fresh shells. Long-returning wall bank
shots can still cause friendly fire.

Cats meow when destroyed and only rarely while roaming.
