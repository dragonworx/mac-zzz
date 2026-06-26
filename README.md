# mac-zzz

A simple CLI tool to schedule your Mac to sleep after a specified duration.

> **⚠️ macOS Only** - This tool only works on macOS as it uses the `pmset sleepnow` command.

## Installation

```bash
npm install -g mac-zzz
```

## Usage

```bash
zzz <duration>
```

### Duration Format

- **Whole numbers** are treated as **minutes**
  - Example: `zzz 30` → Sleep in 30 minutes

- **Decimal numbers** are treated as **hours**
  - Example: `zzz 1.5` → Sleep in 1.5 hours

### Examples

```bash
# Sleep in 30 minutes
zzz 30

# Sleep in 1.5 hours
zzz 1.5

# Sleep in 45 minutes
zzz 45

# Sleep in 2 hours
zzz 2.0

# Sleep now
zzz 0
```

## Features

- Real-time countdown display
- Easy-to-understand duration format
- Cancel anytime with Ctrl+C

## Requirements

- Node.js >= 12.0.0
- macOS (uses `pmset sleepnow` command)

## License

MIT
