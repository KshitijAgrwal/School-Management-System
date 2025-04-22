function setupLoginCard(cardId, modalId) {
    const card = document.getElementById(cardId);
    const modal = document.getElementById(modalId);
    const closeBtn = modal.querySelector('.close');

    card.addEventListener('click', () => modal.style.display = 'block');
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (event) => {
        if (event.target === modal) modal.style.display = 'none';
    });
}

function setupLoginForm(formId, loginHandler, num) {
    const form = document.getElementById(formId);
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementsByName("username")[num].value;
        const password = document.getElementsByName("password")[num].value;
        loginHandler(username, password);
    });
}

// Login functions
async function studentLogin(username, password) {
    try {
        const response = await fetch(`http://localhost:8080/sms/${username}/password/student`);
        if (!response.ok) {
            alert('Invalid username or password!');
            return;
        }
        const data = await response.json();
        if (password === data.password) {
            localStorage.setItem('loggedInUser', username);
            window.location.href = 'DashboardStudent.html';
        } else {
            alert('Invalid username or password!');
        }
    } catch (error) {
        console.error('Error during student login:', error);
        alert('An error occurred during login. Please try again.');
    }
}

async function teacherLogin(username, password) {
    try {
        const response = await fetch(`http://localhost:8080/sms/${username}/password/teacher`);
        if (!response.ok) {
            alert('Invalid username or password!');
            return;
        }
        const data = await response.json();
        if (password === data.password) {
            localStorage.setItem('loggedInUser', username);
            window.location.href = 'DashboardTeacher.html';
        } else {
            alert('Invalid username or password!');
        }
    } catch (error) {
        console.error('Error during teacher login:', error);
        alert('An error occurred during login. Please try again.');
    }
}

async function adminLogin(username, password) {
    try {
        const response = await fetch(`http://localhost:8080/sms/${username}/password/admin`);
        if (!response.ok) {
            alert('Invalid username or password!');
            return;
        }
        const data = await response.json();
        if (password === data.password) {
            localStorage.setItem('loggedInUser', username);
            window.location.href = 'DashboardAdmin.html';
        } else {
            alert('Invalid username or password!');
        }
    } catch (error) {
        console.error('Error during admin login:', error);
        alert('An error occurred during login. Please try again.');
    }
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    // Setup modals
    ['studentLogin', 'teacherLogin', 'adminLogin'].forEach((id, index) => {
        setupLoginCard(id, ['studentLoginModal', 'teacherLoginModal', 'adminLoginModal'][index]);
    });

    // Setup login forms
    setupLoginForm('studentLoginForm', studentLogin, 0);
    setupLoginForm('teacherLoginForm', teacherLogin, 1);
    setupLoginForm('adminLoginForm', adminLogin, 2);
});
