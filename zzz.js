#!/usr/bin/env node

const { exec } = require('child_process');

function showUsage() {
  const CYAN = '\x1b[36m';
  const YELLOW = '\x1b[33m';
  const DIM = '\x1b[2m';
  const RESET = '\x1b[0m';

  console.log(`\n${CYAN}mac-zzz${RESET}\n${DIM}${RESET}$ ${YELLOW}zzz [duration=int(mins)/decimal(hrs) | time=HH:MM[am/pm]]${RESET}${DIM}\nCtrl+C=cancel${RESET}\n`);
}

function showHelp() {
  const CYAN = '\x1b[36m';
  const YELLOW = '\x1b[33m';
  const BOLD = '\x1b[1m';
  const DIM = '\x1b[2m';
  const RESET = '\x1b[0m';

  console.log(`
${CYAN}${BOLD}mac-zzz${RESET} — schedule your Mac to sleep.

${BOLD}USAGE${RESET}
  ${YELLOW}zzz <duration | time>${RESET}

${BOLD}DURATION${RESET}
  ${YELLOW}(none)${RESET}      Sleep (almost) now          ${DIM}zzz      → sleep in 3 seconds${RESET}
  ${YELLOW}0 < n < 1${RESET}   Decimal under 1 = seconds   ${DIM}zzz 0.2  → sleep in 2 seconds (n x 10)${RESET}
  ${YELLOW}<integer>${RESET}   Whole number = minutes      ${DIM}zzz 30   → sleep in 30 minutes${RESET}
  ${YELLOW}<decimal>${RESET}   Decimal >= 1 = hours        ${DIM}zzz 1.5  → sleep in 1.5 hours${RESET}

${BOLD}TIME${RESET}
  ${YELLOW}HH:MM${RESET}       Sleep at a clock time. With no am/pm the next
              matching 12-hour slot is used (whichever comes first).
  ${YELLOW}HH:MMam${RESET}     ${DIM}zzz 6:30am → sleep at the next 6:30 AM${RESET}
  ${YELLOW}HH:MMpm${RESET}     ${DIM}zzz 11:00pm → sleep at the next 11:00 PM${RESET}
              ${DIM}zzz 7:15   → sleep at the next 7:15 (AM or PM, whichever is sooner)${RESET}

${BOLD}OPTIONS${RESET}
  ${YELLOW}-h, --help${RESET}  Show this help.

${DIM}Cancel anytime with Ctrl+C. macOS only (uses 'pmset sleepnow').${RESET}
`);
}

// Parse a clock time like "9:30", "9:30am", "11:00 PM".
// Returns the number of ms from now until that time, rolling forward to the
// next matching slot. With am/pm it's the next such time within 24 hours; with
// no meridiem it's the next matching 12-hour slot (AM or PM, whichever is first).
// Returns null if the input is not a time format.
function parseTargetTime(input) {
  const match = /^(\d{1,2}):(\d{2})\s*(am|pm)?$/i.exec(input.trim());
  if (!match) {
    return null;
  }

  const hour12 = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3] ? match[3].toLowerCase() : null;

  if (hour12 < 1 || hour12 > 12 || minutes > 59) {
    return { error: `Invalid time "${input}". Use HH:MM with hour 1-12 and minute 00-59.` };
  }

  const now = new Date();

  // Build a candidate Date for today at a given 24-hour hour value.
  const candidateAt = (hour24) => {
    const d = new Date(now);
    d.setHours(hour24, minutes, 0, 0);
    return d;
  };

  // On a 12-hour clock, 12 maps to 0 within its half (12:30am → 00:30, 12:30pm → 12:30).
  const baseHour = hour12 % 12;

  let candidates;
  if (meridiem === 'am') {
    candidates = [candidateAt(baseHour)];
  } else if (meridiem === 'pm') {
    candidates = [candidateAt(baseHour + 12)];
  } else {
    // No meridiem: consider both 12-hour slots and pick the soonest upcoming.
    candidates = [candidateAt(baseHour), candidateAt(baseHour + 12)];
  }

  // Roll any non-future candidate forward by 24 hours so it lands tomorrow.
  let target = null;
  for (const c of candidates) {
    while (c.getTime() <= now.getTime()) {
      c.setTime(c.getTime() + 24 * 60 * 60 * 1000);
    }
    if (target === null || c.getTime() < target.getTime()) {
      target = c;
    }
  }

  const ms = target.getTime() - now.getTime();
  const label = target.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return { milliseconds: ms, label };
}

const arg = process.argv[2];

if (arg === '-h' || arg === '--help') {
  showHelp();
  process.exit(0);
}

console.clear();
showUsage();

const duration = arg || '0';

let milliseconds;
let durationDescription;
let sleepPreposition = 'in';

// First, try interpreting the argument as a clock time (contains a colon).
const timeTarget = duration.includes(':') ? parseTargetTime(duration) : null;

if (timeTarget && timeTarget.error) {
  console.error(`Error: ${timeTarget.error}`);
  process.exit(1);
} else if (timeTarget) {
  milliseconds = timeTarget.milliseconds;
  durationDescription = timeTarget.label;
  sleepPreposition = 'at';
} else {
  const parsedDuration = parseFloat(duration);

  if (isNaN(parsedDuration) || parsedDuration < 0) {
    console.error('Error: Duration must be a positive number, zero, or a time (HH:MM[am/pm])');
    process.exit(1);
  }

  // Special case: if 0 is passed, sleep in 3 seconds
  if (parsedDuration === 0) {
    milliseconds = 3000;
    durationDescription = '3 seconds';
  } else if (parsedDuration > 0 && parsedDuration < 1) {
    // Decimal between 0 and 1 = seconds (value x 10): 0.2 -> 2s, 0.45 -> 4.5s
    const seconds = Math.round(parsedDuration * 100) / 10;
    milliseconds = seconds * 1000;
    durationDescription = `${seconds} second${seconds === 1 ? '' : 's'}`;
  } else {
    // Check if the original string contains a decimal point
    const hasDecimalPoint = duration.includes('.');
    const isMinutes = !hasDecimalPoint;

    if (isMinutes) {
      milliseconds = parsedDuration * 60 * 1000;
      durationDescription = `${parsedDuration} minute${parsedDuration === 1 ? '' : 's'}`;
    } else {
      milliseconds = parsedDuration * 60 * 60 * 1000;
      durationDescription = `${parsedDuration} hour${parsedDuration === 1 ? '' : 's'}`;
    }
  }
}

console.log(`Mac will sleep ${sleepPreposition} ${durationDescription}\n`);

const startTime = Date.now();
const endTime = startTime + milliseconds;

// ANSI color codes
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

// Function to format time as HH:MM:SS
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Function to draw progress bar
function drawProgressBar(percentage) {
  const terminalWidth = process.stdout.columns || 80;
  const barWidth = Math.max(terminalWidth - 30, 20);
  const filledWidth = Math.round((barWidth * percentage) / 100);
  const emptyWidth = barWidth - filledWidth;

  const filledBar = '█'.repeat(filledWidth);
  const emptyBar = '░'.repeat(emptyWidth);

  return `${GREEN}${filledBar}${RESET}${emptyBar}`;
}

// Function to update display
function updateDisplay(remaining) {
  const percentage = Math.max(0, Math.round(((milliseconds - remaining) / milliseconds) * 100));
  const timeStr = formatTime(remaining);
  const progressBar = drawProgressBar(percentage);

  process.stdout.write(`\r${progressBar} ${BOLD}${timeStr}${RESET} (${percentage}%)`);
}

// Update countdown every second
const countdownInterval = setInterval(() => {
  const remaining = endTime - Date.now();

  if (remaining <= 0) {
    clearInterval(countdownInterval);
    return;
  }

  updateDisplay(remaining);
}, 1000);

// Show initial countdown
updateDisplay(milliseconds);

setTimeout(() => {
  clearInterval(countdownInterval);

  // Show 100% completion before executing sleep command
  const terminalWidth = process.stdout.columns || 80;
  const barWidth = Math.max(terminalWidth - 30, 20);
  const fullBar = `${GREEN}${'█'.repeat(barWidth)}${RESET}`;
  process.stdout.write(`\r${fullBar} ${BOLD}00:00:00${RESET} (100%)`);

  console.log('\n\nPutting Mac to sleep now...');
  exec('pmset sleepnow', (error) => {
    if (error) {
      console.error(`Error executing sleep command: ${error.message}`);
      process.exit(1);
    }
  });
}, milliseconds);
