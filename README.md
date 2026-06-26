# mac-zzz

A simple CLI tool to schedule your Mac to sleep after a specified duration.

> **⚠️ macOS Only** - This tool only works on macOS as it uses the `pmset sleepnow` command.

## Installation

```bash
npm install -g mac-zzz
```

## Usage

```bash
zzz [duration | time]
```

Run with no argument to sleep now. See all options with `zzz --help`.

### Duration Format

- **No argument** sleeps (almost) now
  - Example: `zzz` → Sleep in 3 seconds

- **Decimals between 0 and 1** are treated as **seconds** (value × 10)
  - Example: `zzz 0.2` → Sleep in 2 seconds
  - Example: `zzz 0.45` → Sleep in 4.5 seconds

- **Whole numbers** are treated as **minutes**
  - Example: `zzz 30` → Sleep in 30 minutes

- **Decimals ≥ 1** are treated as **hours**
  - Example: `zzz 1.5` → Sleep in 1.5 hours

### Time Format

Pass a clock time as `HH:MM` (optionally with `am`/`pm`) to sleep at that time.

- **With `am`/`pm`** sleeps at the next matching time
  - Example: `zzz 6:30am` → Sleep at the next 6:30 AM
  - Example: `zzz 11:00pm` → Sleep at the next 11:00 PM

- **Without `am`/`pm`** rolls to the next matching 12-hour slot (AM or PM, whichever comes first)
  - Example: `zzz 7:15` → Sleep at the next 7:15

### Examples

```bash
# Sleep now
zzz

# Sleep in 2 seconds
zzz 0.2

# Sleep in 4.5 seconds
zzz 0.45

# Sleep in 30 minutes
zzz 30

# Sleep in 1.5 hours
zzz 1.5

# Sleep in 2 hours
zzz 2.0

# Sleep at 6:30 AM
zzz 6:30am

# Sleep at 11 PM
zzz 11:00pm

# Sleep at the next 7:15 (AM or PM, whichever comes first)
zzz 7:15
```

## Features

- Real-time countdown display
- Flexible duration **or** exact clock-time scheduling
- Cancel anytime with Ctrl+C
- Built-in help: `zzz --help`

## Requirements

- Node.js >= 12.0.0
- macOS (uses `pmset sleepnow` command)

## License

MIT
