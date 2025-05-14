import './style.css';

function formatTime(time: number): string {
  return time < 10 ? `0${time}` : `${time}`;
}

function syncTimeUpdate() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  const timeString = `${formatTime(hours)}:${formatTime(minutes)}`;

  const timeElement = document.getElementById('currentTime');
  if (timeElement) {
    timeElement.textContent = timeString;
  }

  const delay = 1000 - now.getMilliseconds();
  setTimeout(syncTimeUpdate, delay);
}

document.addEventListener('DOMContentLoaded', () => {
  syncTimeUpdate();
});
