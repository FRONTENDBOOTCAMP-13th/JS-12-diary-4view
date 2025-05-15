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

export function getProfileValueByKey(key: string): string | null {
  const profileStr = localStorage.getItem('profile');

  if (!profileStr) return null;

  try {
    const profile = JSON.parse(profileStr);
    return profile[key] ?? null;
  } catch (e) {
    console.error('profile 데이터 파싱 에러:', e);
    return null;
  }
}
