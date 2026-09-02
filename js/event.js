function getEventState(data) {
  if (!data) return "READY";
  if (data.status) return String(data.status).toUpperCase();

  const now = Date.now();
  const start = data.startTime ? new Date(data.startTime).getTime() : NaN;
  const end = data.endTime ? new Date(data.endTime).getTime() : NaN;

  if (Number.isFinite(start) && now < start) return "READY";
  if (Number.isFinite(end) && now > end) return "ENDED";
  if (Number.isFinite(start) && now >= start) return "LIVE";

  return "READY";
}

function formatTimeUnit(value) {
  return String(Math.max(0, value)).padStart(2, "0");
}

function updateCountdown(targetTime, elements) {
  const target = new Date(targetTime).getTime();
  if (!Number.isFinite(target)) return false;

  const distance = target - Date.now();
  if (distance <= 0) {
    elements.days.textContent = "00";
    elements.hours.textContent = "00";
    elements.minutes.textContent = "00";
    elements.seconds.textContent = "00";
    return true;
  }

  const totalSeconds = Math.floor(distance / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  elements.days.textContent = String(days).padStart(2, "0");
  elements.hours.textContent = formatTimeUnit(hours);
  elements.minutes.textContent = formatTimeUnit(minutes);
  elements.seconds.textContent = formatTimeUnit(seconds);

  return false;
}
