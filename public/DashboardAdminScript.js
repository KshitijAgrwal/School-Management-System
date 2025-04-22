class AdminFunctions {
    constructor() {
        this.initEventListeners();
    }

    initEventListeners() {
        const options = [
            { cardId: 'enrollStudent', modalId: 'enrollStudentModal' },
            { cardId: 'allotClasses', modalId: 'allotClassesModal' },
            { cardId: 'libraryManagement', modalId: 'libraryManagementModal' },
            { cardId: 'updateInventory', modalId: 'updateInventoryModal' },
            { cardId: 'timetableManagement', modalId: 'timetableManagementModal' }
        ];
        options.forEach(({ cardId, modalId }) => this.setupOption(cardId, modalId));
    }

    setupOption(cardId, modalId) {
        const card = document.getElementById(cardId);
        const modal = document.getElementById(modalId);
        const closeBtn = modal.querySelector('.close');

        card.addEventListener('click', () => modal.style.display = 'block');
        closeBtn.addEventListener('click', () => modal.style.display = 'none');
        window.addEventListener('click', (event) => {
            if (event.target === modal) modal.style.display = 'none';
        });
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => toast.className = 'toast', 3000);
}

//Student Enrollment
async function enrollStudent(studentID, name, DOB, gender, pass, classID) {
    try {
        const response = await fetch("http://localhost:8080/sms/enrollStudent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentID: parseInt(studentID), name, DOB, gender, pass, classID })
        });
        const result = await response.json();
        if (!response.ok) {
            showToast("Error: " + (result.error || "Enrollment failed."), "error");
            return;
        }
        showToast("Student enrolled successfully!", "success");
        document.querySelectorAll('[name^="enroll_"]').forEach(input => input.value = "");
        document.getElementsByName("enroll_studentDOB")[0].value = "dd-mm-yyyy";
    } catch (error) {
        showToast("Something went wrong while enrolling student.", "error");
    }
}

async function createTest(testName, maxMarks, testDate) {
    try {
        const response = await fetch("http://localhost:8080/sms/createTest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ testName, maxMarks: parseInt(maxMarks), testDate })
        });
        const result = await response.json();
        if (!response.ok) {
            showToast("Error: " + (result.error || "Failed to create test."), "error");
            return;
        }
        showToast("Test created successfully!", "success");
        document.getElementById('createTestForm').reset();
    } catch (error) {
        showToast("Something went wrong while creating test.", "error");
    }
}

// Inventory Management
async function manageInventory(itemId, itemName, quantity) {
    try {
        const response = await fetch('http://localhost:8080/sms/inventory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId, itemName, quantity: parseInt(quantity) })
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Network response was not ok');
        }
        showToast(itemId ? 'Item updated successfully' : 'Item added successfully', 'success');
        return true;
    } catch (error) {
        showToast(error.message || 'Error managing inventory', 'error');
        return false;
    }
}

async function fetchInventoryItems() {
    try {
        const response = await fetch('http://localhost:8080/sms/inventory');
        const data = await response.json();

        if (!response.ok) throw new Error('Network response was not ok');
        if (!Array.isArray(data)) {
            throw new Error('Invalid data format received');
        }
        return data;
    } catch (error) {
        showToast('Error fetching inventory items', 'error');
        console.error('Error:', error);
        return [];
    }
}

function displayInventoryItems(items) {
    const inventoryItems = document.getElementById('inventoryItems');
    if (!items?.length) {
        inventoryItems.innerHTML = '<p>No inventory items found</p>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'inventory-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Quantity</th>
            </tr>
        </thead>
        <tbody>
            ${items.map(item => `
                <tr>
                    <td>${item.Item_ID || '-'}</td>
                    <td>${item.Item_Name || '-'}</td>
                    <td>${item.Quantity || '-'}</td>
                </tr>
            `).join('')}
        </tbody>
    `;

    inventoryItems.innerHTML = '';
    inventoryItems.appendChild(table);
}

// Library Management Functions
async function addBook(bookID, title, author, quantity) {
    try {
        const response = await fetch("http://localhost:8080/sms/library/addBook", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookID, title, author, quantity: parseInt(quantity) })
        });
        const result = await response.json();
        if (!response.ok) {
            showToast("Error: " + (result.error || "Failed to add book."), "error");
            return;
        }
        showToast("Book added successfully!", "success");
        document.querySelectorAll('[name^="book"]').forEach(input => input.value = "");
    } catch (error) {
        showToast("Something went wrong while adding book.", "error");
    }
}

async function removeBook(bookID) {
    try {
        const response = await fetch(`http://localhost:8080/sms/library/removeBook/${bookID}`, {
            method: "DELETE"
        });
        const result = await response.json();
        if (!response.ok) {
            showToast("Error: " + (result.error || "Failed to remove book."), "error");
            return;
        }
        showToast("Book removed successfully!", "success");
        document.querySelectorAll('[name^="book"]').forEach(input => input.value = "");
    } catch (error) {
        showToast("Something went wrong while removing book.", "error");
    }
}

async function issueBook(studentID, bookID) {
    try {
        const response = await fetch("http://localhost:8080/sms/library/issueBook", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentID, bookID })
        });
        const result = await response.json();
        if (!response.ok) {
            showToast("Error: " + (result.error || "Failed to issue book."), "error");
            return;
        }
        showToast("Book issued successfully!", "success");
        document.querySelectorAll('[name^="student"], [name^="book"]').forEach(input => input.value = "");
    } catch (error) {
        showToast("Something went wrong while issuing book.", "error");
    }
}

async function returnBook(studentID, bookID) {
    try {
        const response = await fetch("http://localhost:8080/sms/library/returnBook", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentID, bookID })
        });
        const result = await response.json();
        if (!response.ok) {
            showToast("Error: " + (result.error || "Failed to return book."), "error");
            return;
        }
        showToast("Book returned successfully!", "success");
        document.querySelectorAll('[name^="student"], [name^="book"]').forEach(input => input.value = "");
    } catch (error) {
        showToast("Something went wrong while returning book.", "error");
    }
}

async function fetchBooks() {
    try {
        const response = await fetch("http://localhost:8080/sms/library/books");
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || "Failed to fetch books");
        }
        
        return data;
    } catch (error) {
        console.error('Error fetching books:', error);
        showToast("Error fetching books: " + error.message, "error");
        return [];
    }
}

async function fetchIssues() {
    try {
        const response = await fetch("http://localhost:8080/sms/library/issues");
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || "Failed to fetch issues");
        }
        
        return data;
    } catch (error) {
        console.error('Error fetching issues:', error);
        showToast("Error fetching issues: " + error.message, "error");
        return [];
    }
}

function displayBooks(books) {
    const booksList = document.getElementById('booksList');
    if (!books?.length) {
        booksList.innerHTML = '<p>No books available</p>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'books-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Author</th>
                <th>Quantity</th>
            </tr>
        </thead>
        <tbody>
            ${books.map(book => `
                <tr>
                    <td>${book.Book_ID}</td>
                    <td>${book.Title}</td>
                    <td>${book.Author}</td>
                    <td>${book.Quantity}</td>
                </tr>
            `).join('')}
        </tbody>
    `;

    booksList.innerHTML = '';
    booksList.appendChild(table);
}

function displayIssues(issues) {
    const issuesList = document.getElementById('issuesList');
    if (!issues?.length) {
        issuesList.innerHTML = '<p>No active issues</p>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'issues-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Book ID</th>
                <th>Book Title</th>
                <th>Issue Date</th>
            </tr>
        </thead>
        <tbody>
            ${issues.map(issue => `
                <tr>
                    <td>${issue.Student_ID}</td>
                    <td>${issue.Student_Name}</td>
                    <td>${issue.Book_ID}</td>
                    <td>${issue.Title}</td>
                    <td>${new Date(issue.Issue_Date).toLocaleDateString()}</td>
                </tr>
            `).join('')}
        </tbody>
    `;

    issuesList.innerHTML = '';
    issuesList.appendChild(table);
}

// Timetable Management Functions
async function addTimetableEntry(teacherID, subjectID, classID, dayOfWeek, startTime, endTime) {
    try {
        const response = await fetch("http://localhost:8080/sms/timetable/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teacherID, subjectID, classID, dayOfWeek, startTime, endTime })
        });
        const result = await response.json();
        if (!response.ok) {
            showToast("Error: " + (result.error || "Failed to add timetable entry."), "error");
            return;
        }
        showToast("Timetable entry added successfully!", "success");
        document.getElementById('addTimetableFormData').reset();
    } catch (error) {
        showToast("Something went wrong while adding timetable entry.", "error");
    }
}

async function updateTimetableEntry(timetableID, teacherID, subjectID, classID, dayOfWeek, startTime, endTime) {
    try {
        const response = await fetch(`http://localhost:8080/sms/timetable/update/${timetableID}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teacherID, subjectID, classID, dayOfWeek, startTime, endTime })
        });
        const result = await response.json();
        if (!response.ok) {
            showToast("Error: " + (result.error || "Failed to update timetable entry."), "error");
            return;
        }
        showToast("Timetable entry updated successfully!", "success");
        document.getElementById('updateTimetableFormData').reset();
    } catch (error) {
        showToast("Something went wrong while updating timetable entry.", "error");
    }
}

async function deleteTimetableEntry(timetableID) {
    try {
        const response = await fetch(`http://localhost:8080/sms/timetable/delete/${timetableID}`, {
            method: "DELETE"
        });
        const result = await response.json();
        if (!response.ok) {
            showToast("Error: " + (result.error || "Failed to delete timetable entry."), "error");
            return;
        }
        showToast("Timetable entry deleted successfully!", "success");
        document.getElementById('deleteTimetableFormData').reset();
    } catch (error) {
        showToast("Something went wrong while deleting timetable entry.", "error");
    }
}

// Initialize everything

document.getElementById("createTestForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const testName = formData.get("testName");
    const maxMarks = formData.get("maxMarks");
    const testDate = formData.get("testDate");

    await createTest(testName, maxMarks, testDate);
});
  

document.addEventListener('DOMContentLoaded', () => {
    new AdminFunctions();
    
    // Enroll student form setup
    document.getElementById('enrollButton').addEventListener('click', (e) => {
        e.preventDefault();
        const inputs = document.querySelectorAll('[name^="enroll_"]');
        const values = Array.from(inputs).map(input => input.value.trim());
        
        if (values.some(v => !v)) {
            showToast("Please fill in all fields.", "error");
            return;
        }
        
        enrollStudent(...values);
    });

    // Inventory management
    const elements = {
        addItemBtn: document.getElementById('addItemBtn'),
        viewItemsBtn: document.getElementById('viewItemsBtn'),
        updateItemBtn: document.getElementById('updateItemBtn'),
        addItemForm: document.getElementById('addItemForm'),
        viewItemsList: document.getElementById('viewItemsList'),
        updateItemForm: document.getElementById('updateItemForm'),
        addItemFormData: document.getElementById('addItemFormData'),
        updateItemFormData: document.getElementById('updateItemFormData')
    };

    const hideAllForms = () => {
        [elements.addItemForm, elements.viewItemsList, elements.updateItemForm].forEach(el => el?.classList.add('hidden'));
    };

    // Form visibility handlers
    elements.addItemBtn.addEventListener('click', () => {
        hideAllForms();
        elements.addItemForm.classList.remove('hidden');
    });

    elements.viewItemsBtn.addEventListener('click', async () => {
        hideAllForms();
        elements.viewItemsList.classList.remove('hidden');
        const items = await fetchInventoryItems();
        displayInventoryItems(items);
    });

    elements.updateItemBtn.addEventListener('click', () => {
        hideAllForms();
        elements.updateItemForm.classList.remove('hidden');
    });

    // Form submissions
    elements.addItemFormData?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const itemName = formData.get('itemName');
        const quantity = formData.get('quantity');

        if (!itemName || !quantity) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        if (await manageInventory(null, itemName, quantity)) {
            e.target.reset();
            hideAllForms();
        }
    });

    elements.updateItemFormData?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const itemId = formData.get('itemId');
        const quantity = formData.get('quantity');
        const numQuantity = parseInt(quantity);

        if (!itemId || !quantity || numQuantity < 0) {
            showToast(numQuantity < 0 ? 'Quantity cannot be negative' : 'Please fill in all fields', 'error');
            return;
        }

        if (await manageInventory(parseInt(itemId), null, numQuantity)) {
            e.target.reset();
            hideAllForms();
            const items = await fetchInventoryItems();
            displayInventoryItems(items);
        }
    });

    // Library management
    const libraryElements = {
        addBookBtn: document.getElementById('addBookBtn'),
        removeBookBtn: document.getElementById('removeBookBtn'),
        issueBookBtn: document.getElementById('issueBookBtn'),
        returnBookBtn: document.getElementById('returnBookBtn'),
        viewBooksBtn: document.getElementById('viewBooksBtn'),
        viewIssuesBtn: document.getElementById('viewIssuesBtn'),
        addBookForm: document.getElementById('addBookForm'),
        removeBookForm: document.getElementById('removeBookForm'),
        issueBookForm: document.getElementById('issueBookForm'),
        returnBookForm: document.getElementById('returnBookForm'),
        viewBooksList: document.getElementById('viewBooksList'),
        viewIssuesList: document.getElementById('viewIssuesList'),
        addBookFormData: document.getElementById('addBookFormData'),
        removeBookFormData: document.getElementById('removeBookFormData'),
        issueBookFormData: document.getElementById('issueBookFormData'),
        returnBookFormData: document.getElementById('returnBookFormData')
    };

    const hideAllLibraryForms = () => {
        [
            libraryElements.addBookForm,
            libraryElements.removeBookForm,
            libraryElements.issueBookForm,
            libraryElements.returnBookForm,
            libraryElements.viewBooksList,
            libraryElements.viewIssuesList
        ].forEach(el => el?.classList.add('hidden'));
    };

    // Form visibility handlers
    libraryElements.addBookBtn.addEventListener('click', () => {
        hideAllLibraryForms();
        libraryElements.addBookForm.classList.remove('hidden');
    });

    libraryElements.removeBookBtn.addEventListener('click', () => {
        hideAllLibraryForms();
        libraryElements.removeBookForm.classList.remove('hidden');
    });

    libraryElements.issueBookBtn.addEventListener('click', () => {
        hideAllLibraryForms();
        libraryElements.issueBookForm.classList.remove('hidden');
    });

    libraryElements.returnBookBtn.addEventListener('click', () => {
        hideAllLibraryForms();
        libraryElements.returnBookForm.classList.remove('hidden');
    });

    libraryElements.viewBooksBtn.addEventListener('click', async () => {
        hideAllLibraryForms();
        libraryElements.viewBooksList.classList.remove('hidden');
        const books = await fetchBooks();
        displayBooks(books);
    });

    libraryElements.viewIssuesBtn.addEventListener('click', async () => {
        hideAllLibraryForms();
        libraryElements.viewIssuesList.classList.remove('hidden');
        const issues = await fetchIssues();
        displayIssues(issues);
    });

    // Form submissions
    libraryElements.addBookFormData?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const bookID = formData.get('bookID');
        const title = formData.get('title');
        const author = formData.get('author');
        const quantity = formData.get('quantity');

        if (!bookID || !title || !author || !quantity) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        await addBook(bookID, title, author, quantity);
        e.target.reset();
        hideAllLibraryForms();
    });

    libraryElements.removeBookFormData?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const bookID = formData.get('bookID');

        if (!bookID) {
            showToast('Please enter a book ID', 'error');
            return;
        }

        await removeBook(bookID);
        e.target.reset();
        hideAllLibraryForms();
    });

    libraryElements.issueBookFormData?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const studentID = formData.get('studentID');
        const bookID = formData.get('bookID');

        if (!studentID || !bookID) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        await issueBook(studentID, bookID);
        e.target.reset();
        hideAllLibraryForms();
    });

    libraryElements.returnBookFormData?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const studentID = formData.get('studentID');
        const bookID = formData.get('bookID');

        if (!studentID || !bookID) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        await returnBook(studentID, bookID);
        e.target.reset();
        hideAllLibraryForms();
    });

    // Setup timetable management
    const timetableModal = document.getElementById('timetableManagementModal');
    const timetableCard = document.getElementById('timetableManagement');
    
    if (timetableCard && timetableModal) {
        // Open modal when clicking the card
        timetableCard.addEventListener('click', () => {
            timetableModal.style.display = 'block';
        });

        // Close modal when clicking the close button
        const closeBtn = timetableModal.querySelector('.close');
        closeBtn.addEventListener('click', () => {
            timetableModal.style.display = 'none';
        });

        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === timetableModal) {
                timetableModal.style.display = 'none';
            }
        });

        const timetableElements = {
            addTimetableBtn: document.getElementById('addTimetableBtn'),
            updateTimetableBtn: document.getElementById('updateTimetableBtn'),
            deleteTimetableBtn: document.getElementById('deleteTimetableBtn'),
            addTimetableForm: document.getElementById('addTimetableForm'),
            updateTimetableForm: document.getElementById('updateTimetableForm'),
            deleteTimetableForm: document.getElementById('deleteTimetableForm'),
            addTimetableFormData: document.getElementById('addTimetableFormData'),
            updateTimetableFormData: document.getElementById('updateTimetableFormData'),
            deleteTimetableFormData: document.getElementById('deleteTimetableFormData')
        };

        const hideAllTimetableForms = () => {
            [timetableElements.addTimetableForm, timetableElements.updateTimetableForm, timetableElements.deleteTimetableForm]
                .forEach(el => el?.classList.add('hidden'));
        };

        // Form visibility handlers
        if (timetableElements.addTimetableBtn) {
            timetableElements.addTimetableBtn.addEventListener('click', () => {
                hideAllTimetableForms();
                timetableElements.addTimetableForm.classList.remove('hidden');
            });
        }

        if (timetableElements.updateTimetableBtn) {
            timetableElements.updateTimetableBtn.addEventListener('click', () => {
                hideAllTimetableForms();
                timetableElements.updateTimetableForm.classList.remove('hidden');
            });
        }

        if (timetableElements.deleteTimetableBtn) {
            timetableElements.deleteTimetableBtn.addEventListener('click', () => {
                hideAllTimetableForms();
                timetableElements.deleteTimetableForm.classList.remove('hidden');
            });
        }

        // Form submissions
        if (timetableElements.addTimetableFormData) {
            timetableElements.addTimetableFormData.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const teacherID = formData.get('teacherID');
                const subjectID = formData.get('subjectID');
                const classID = formData.get('classID');
                const dayOfWeek = formData.get('dayOfWeek');
                const startTime = formData.get('startTime');
                const endTime = formData.get('endTime');

                await addTimetableEntry(teacherID, subjectID, classID, dayOfWeek, startTime, endTime);
                hideAllTimetableForms();
            });
        }

        if (timetableElements.updateTimetableFormData) {
            timetableElements.updateTimetableFormData.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const timetableID = formData.get('timetableID');
                const teacherID = formData.get('teacherID');
                const subjectID = formData.get('subjectID');
                const classID = formData.get('classID');
                const dayOfWeek = formData.get('dayOfWeek');
                const startTime = formData.get('startTime');
                const endTime = formData.get('endTime');

                await updateTimetableEntry(timetableID, teacherID, subjectID, classID, dayOfWeek, startTime, endTime);
                hideAllTimetableForms();
            });
        }

        if (timetableElements.deleteTimetableFormData) {
            timetableElements.deleteTimetableFormData.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const timetableID = formData.get('timetableID');

                await deleteTimetableEntry(timetableID);
                hideAllTimetableForms();
            });
        }
    }
});

window.addEventListener("beforeunload", (event) => {
    if (event.persisted === false) {
        localStorage.clear();
    }
});
