document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById('sign-in-form');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        let username = document.getElementById('floatingInput').value;
        let password = document.getElementById('floatingPassword').value;

        let response = await fetch('/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
            credentials: 'include'
        });

        if (response.ok) {
            let data = await response.json();
            localStorage.setItem('jwt', data.token);
            window.location.href = '/admin/dashboard';
        } else {
            alert('Login failed');
        }
    });
});
