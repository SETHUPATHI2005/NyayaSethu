function readUser() {
  try {
    return JSON.parse(localStorage.getItem('nyayamithra_user') || 'null');
  } catch {
    return null;
  }
}

const user = readUser();
if (!user || !user.email) {
  window.location.href = 'login.html';
}

if (user) {
  document.getElementById('welcomeName').textContent = `Welcome, ${user.full_name || 'User'}`;
  document.getElementById('welcomeEmail').textContent = user.email;
  document.getElementById('metaName').textContent = user.full_name || '-';
  document.getElementById('metaEmail').textContent = user.email || '-';
}

document.getElementById('logoutBtn')?.addEventListener('click', () => {
  localStorage.removeItem('nyayamithra_user');
  window.location.href = 'login.html';
});

