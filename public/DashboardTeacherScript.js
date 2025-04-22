class TeacherFunctions {
    constructor() {
        this.initEventListeners();
    }

    initEventListeners() {
        const options = [
            { cardId: 'classInfo', modalId: 'classModal', onOpen: fetchTeacherTimetable },
            { cardId: 'updateTestInfo', modalId: 'updateTestModal' },
            { cardId: 'updateAttendanceInfo', modalId: 'updateAttendanceModal' }
        ];
        options.forEach(({ cardId, modalId, onOpen }) => this.setupOption(cardId, modalId, onOpen));
    }

    setupOption(cardId, modalId, onOpen) {
        const card = document.getElementById(cardId);
        const modal = document.getElementById(modalId);
        const closeBtn = modal.querySelector('.close');

        if (card && modal) {
            card.addEventListener('click', async () => {
                modal.style.display = 'block';
                if (onOpen) {
                    await onOpen();
                }
            });

            closeBtn.addEventListener('click', () => modal.style.display = 'none');
            window.addEventListener('click', (event) => {
                if (event.target === modal) modal.style.display = 'none';
            });
        }
    }
}

function setupInsertMarksForm(buttonId, insertHandler) {
    const button = document.getElementById(buttonId);
    button.addEventListener('click', (e) => {
        e.preventDefault();
        const [studentID, testID, marksObtained] = ['test_studentID', 'test_testID', 'test_marksObtained']
            .map(name => document.getElementsByName(name)[0].value.trim());
        insertHandler(studentID, testID, marksObtained);
    });
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => toast.className = 'toast', 3000);
}

async function insertTestMarks(studentID, testID, marksObtained) {
    if (!studentID || !testID || marksObtained === "") {
        alert("Please fill in all fields.");
        return;
    }
    console.log("Recahed");
    try {
        const response = await fetch("http://localhost:8080/sms/testMarks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentID, testID, marksObtained: parseInt(marksObtained) })
        });

        const result = await response.json();

        if (response.ok) {
            showToast(response.status === 200 ? "Marks updated successfully!" : "Marks inserted successfully!", "success");
            ['test_studentID', 'test_testID', 'test_marksObtained'].forEach(name => {
                document.getElementsByName(name)[0].value = "";
            });
        } else {
            const errorMessages = {
                "Student does not exist": "Error: Student does not exist",
                "Test does not exist": "Error: Test does not exist"
            };
            showToast(errorMessages[result.error] || `Error: ${result.error || "Failed to insert/update marks."}`, "error");
        }
    } catch (error) {
        showToast("Something went wrong while inserting/updating marks.", "error");
    }
}

async function updateAttendance(studentID, subjectID, status) {
    try {
        const response = await fetch("http://localhost:8080/sms/updateAttendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentID, subjectID, status })
        });

        if (response.ok) {
            showToast("Attendance updated successfully!", "success");
            document.getElementById('attendance_studentID').value = "";
            document.getElementById('attendance_subjectID').value = "";
        } else {
            showToast("Error updating attendance", "error");
        }
    } catch (error) {
        showToast("Something went wrong while updating attendance", "error");
    }
}

// Timetable functions
async function fetchTeacherTimetable() {
    try {
        const teacherID = localStorage.getItem('loggedInUser');
        console.log('Fetching timetable for teacher ID:', teacherID);

        const response = await fetch(`http://localhost:8080/sms/timetable/teacher/${teacherID}`);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            throw new Error(errorData.message || 'Failed to fetch timetable');
        }
        
        const timetable = await response.json();
        console.log('Fetched timetable:', timetable);
        displayTimetable(timetable);
    } catch (error) {
        console.error('Error in fetchTeacherTimetable:', error);
        showToast('Error fetching timetable', 'error');
    }
}

function displayTimetable(timetable) {
    const tbody = document.getElementById('timetableBody');
    tbody.innerHTML = '';
    
    if (!timetable || timetable.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="no-classes">No classes scheduled</td></tr>';
        return;
    }

    timetable.forEach(entry => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.Day_Of_Week || entry.dayOfWeek}</td>
            <td>${entry.Start_Time || entry.startTime} - ${entry.End_Time || entry.endTime}</td>
            <td>${entry.Subject_Name || entry.subjectName}</td>
            <td>${entry.Class_Name || entry.Section}</td>
        `;
        tbody.appendChild(row);
    });

    // Add the fees-table class to the table
    const table = tbody.closest('table');
    if (table) {
        table.className = 'fees-table';
    }
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    new TeacherFunctions();
    
    // Setup form handlers
    const insertMarksButton = document.getElementById('insertMarks');
    if (insertMarksButton) {
        insertMarksButton.addEventListener('click', (e) => {
            e.preventDefault();
            const studentID = document.getElementsByName('test_studentID')[0].value;
            const testID = document.getElementsByName('test_testID')[0].value;
            const marksObtained = document.getElementsByName('test_marksObtained')[0].value;
            insertTestMarks(studentID, testID, marksObtained);
        });
    }
    
    // Setup attendance form
    const updateAttendanceForm = document.getElementById('updateAttendanceForm');
    if (updateAttendanceForm) {
        updateAttendanceForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const studentID = document.getElementById('attendance_studentID').value;
            const subjectID = document.getElementById('attendance_subjectID').value;
            const status = document.getElementById('attendance_status').value;
            updateAttendance(studentID, subjectID, status);
        });
    }
});

window.addEventListener("beforeunload", (event) => {
    if (event.persisted === false) {
        localStorage.clear();
    }
});
