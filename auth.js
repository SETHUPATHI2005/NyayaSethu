const API = window.NYAYASETHU_API || '';

function setMsg(text, ok = false) {
  const el = document.getElementById('authMsg');
  if (!el) return;
  el.textContent = text;
  el.className = `auth-msg ${ok ? 'ok' : 'err'}`;
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMsg('');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setMsg(data.message || 'Login failed.');
        return;
      }
      localStorage.setItem('nyayasethu_user', JSON.stringify(data.user));
      setMsg('Login successful. Redirecting...', true);
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
    } catch {
      setMsg('Unable to connect to backend. Open this page with ?api=https://your-backend-url once.');
    }
  });
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMsg('');
    const full_name = document.getElementById('full_name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name, email, password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setMsg(data.message || 'Registration failed.');
        return;
      }
      localStorage.setItem('nyayasethu_user', JSON.stringify(data.user));
      setMsg('Registration successful. Redirecting...', true);
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 900);
    } catch {
      setMsg('Unable to connect to backend. Open this page with ?api=https://your-backend-url once.');
    }
  });
}

