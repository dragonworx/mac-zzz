#!/usr/bin/env node

const { exec } = require('child_process');

function showUsage() {
  const CYAN = '\x1b[36m';
  const YELLOW = '\x1b[33m';
  const DIM = '\x1b[2m';
  const RESET = '\x1b[0m';

  console.log(`\n${CYAN}mac-zzz${RESET}\n${DIM}${RESET}$ ${YELLOW}zzz [duration as integer=mins | decimal=hours]${RESET}${DIM}\nCtrl+C=cancel${RESET}\n`);
}

console.clear();
showUsage();

const duration = process.argv[2] || '0';

const parsedDuration = parseFloat(duration);

if (isNaN(parsedDuration) || parsedDuration < 0) {
  console.error('Error: Duration must be a positive number or zero');
  process.exit(1);
}

let milliseconds;
let durationDescription;

// Special case: if 0 is passed, sleep in 3 seconds
if (parsedDuration === 0) {
  milliseconds = 3000;
  durationDescription = '3 seconds';
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

console.log(`Mac will sleep in ${durationDescription}\n`);

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
