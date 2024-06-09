//Toaster meassage
function showSuccessToast(message, callback) {
    showToast(message, 'success', callback);
}

function showErrorToast(message, callback) {
    showToast(message, 'error', callback);
}

function showToast(message, type, callback) {

    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.classList.add('toast', type);
    toast.innerText = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
        if (typeof callback === 'function') {
            callback();
        }

    }, 2000);
}

//signup
function signUp(event) {
    event.preventDefault();

    const name = document.getElementById('userName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const fields = { name, email, password };
    const emptyFields = Object.keys(fields).filter(key => !fields[key]);

    if (emptyFields.length > 0) {
        return showErrorToast(`${emptyFields.join(', ').toUpperCase()} fields are required`)
    }

    const bodyParams = {
        name,
        email,
        password
    };

    // Sending the data to the backend API using fetch
    fetch('http://localhost:8080/api/signup', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(bodyParams)
    })
    .then(response => response.json())
    .then(data => {
        if(data.error){
            const errorMessage = data.error.message;
            showErrorToast(errorMessage);
        }else if(data.success){
            const successMessage = data.success.message;
            showSuccessToast(successMessage, () => {
                window.location.href = 'signIn.html';
            });
        }    
    })
    .catch(error => {
        showErrorToast('Error during signup. Please try again.');
    });

}

//login 
function signIn(event){
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const fields = {email, password };
    const emptyFields = Object.keys(fields).filter(key => !fields[key]);

    if (emptyFields.length > 0) {
        return showErrorToast(`${emptyFields.join(', ').toUpperCase()} fields are required`)
    }

    const bodyParams = {
        email,
        password
    }

    fetch('http://localhost:8080/api/signin', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(bodyParams)
    })
    .then(response => response.json())
    .then(data => {
        if(data.error){
            const errorMessage = data.error.message;
            showErrorToast(errorMessage);
        }else if(data.success){
            const successMessage = data.success.message;
            localStorage.setItem('token', data.success.token)
            showSuccessToast(successMessage, () => {
                window.location.href = 'index.html';
            });
        }    
    })
    .catch(error => {
        showErrorToast('Error during signup. Please try again.');
    });
}


//request for password
async function handleResetRequest() {
    const email = document.getElementById('email').value;
    
    try {
        const response = await fetch('http://localhost:8080/api/request-reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();
        
        if (data.error) {
            showErrorToast(data.error.message);
        } else if (data.success) {
            showSuccessToast(data.success.message, () => {
                window.location.href = 'signIn.html';
            });
        }
    } catch (error) {
        showErrorToast('Error during password reset request. Please try again.');
    }
}


//password changing
async function handleChangePassword() {
    const urlParams = new URLSearchParams(window.location.search);
    const resetId = urlParams.get('id');

    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm_password').value;

    if (password !== confirmPassword) {
        showErrorToast('Passwords do not match!');
        return;
    }

    const bodyParams = {
        id: resetId,
        password: password,
        confirmpassword: confirmPassword
    };

    try {
        const response = await fetch('http://localhost:8080/api/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bodyParams)
        });

        const data = await response.json();

        if (data.error) {
            showErrorToast(data.error.message);
        } else if (data.success) {
            showSuccessToast(data.success.message, () => {
                window.location.href = 'signIn.html';
            });
        }
    } catch (error) {
        showErrorToast('Error during password reset. Please try again.', () => {
            window.location.href = 'signIn.html';
        });
    }
}
