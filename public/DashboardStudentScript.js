class StudentFunctions {
    constructor() {
        this.initEventListeners();
    }

    initEventListeners() {
        const options = [
            { cardId: 'guardianInfo', modalId: 'guardianModal' },
            { cardId: 'teacherInfo', modalId: 'teacherModal' },
            { cardId: 'testInfo', modalId: 'testModal' },
            { cardId: 'feesInfo', modalId: 'feesModal' },
            { cardId: 'attendanceInfo', modalId: 'attendanceModal' }
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

async function loadGuardianData(studentID) {
    try {
        const [guardianResponse, usernameResponse] = await Promise.all([
            fetch(`http://localhost:8080/sms/${studentID}/guardian`),
            fetch(`http://localhost:8080/sms/${studentID}/Name/student`)
        ]);

        if (!guardianResponse.ok || !usernameResponse.ok) {
            console.log("Could not fetch data!");
            return;
        }

        const { guardians, relations } = await guardianResponse.json();
        const username = await usernameResponse.json();
        
        const guardianSelect = document.getElementById("guardianSelect");
        document.getElementById("WelcomeMessage").textContent = `Welcome, ${username.Name}`;
        
        relations.forEach((relation, index) => {
            const option = document.createElement("option");
            option.value = index;
            option.textContent = relation.Relation_Type;
            guardianSelect.appendChild(option);
        });

        updateGuardianDetails(guardians[0], relations[0]);

        guardianSelect.addEventListener("change", function () {
            updateGuardianDetails(guardians[this.value], relations[this.value]);
        });
    } catch (error) {
        console.error("Error loading guardian data:", error);
    }
}

function updateGuardianDetails(guardian, relation) {
    const container = document.getElementById("guardianInfoContainer");
    container.innerHTML = `
        <p><strong>Name:</strong> ${guardian.Name}</p>
        <p><strong>Contact:</strong> ${guardian.Phone}</p>
        <p><strong>Email:</strong> ${guardian.Email}</p>
        <p><strong>Address:</strong> ${guardian.Address}</p>
        <p><strong>Relation:</strong> ${relation.Relation_Type}</p>
    `;
}

async function loadTestDetails(studentID) {
    try {
        const response = await fetch(`http://localhost:8080/sms/${studentID}/test`);
        if (!response.ok) {
            console.log("Could not fetch test data!");
            return;
        }

        const { tests, marks } = await response.json();
        const testSelect = document.getElementById("testSelect");

        tests.forEach((test, index) => {
            const option = document.createElement("option");
            option.value = index;
            option.textContent = test.Test_Type;
            testSelect.appendChild(option);
        });

        updateTestDetails(tests[0], marks[0]);
        testSelect.addEventListener("change", function () {
            updateTestDetails(tests[this.value], marks[this.value]);
        });
    } catch (error) {
        console.error("Error loading test details:", error);
    }
}

function updateTestDetails(testInfo, testMarks) {
    const container = document.getElementById("testInfoContainer");
    container.innerHTML = `
        <p><strong>Name:</strong> ${testInfo.Test_Type}</p>
        <p><strong>Marks Obtained:</strong> ${testMarks.Marks_Obtained}/${testInfo.Max_Marks}</p>
    `;
}

async function loadAttendanceDetails(studentID) {
    try {
        const response = await fetch(`http://localhost:8080/sms/${studentID}/attendance`);
        if (!response.ok) {
            console.log("Could not fetch attendance data!");
            return;
        }

        const attendanceInfo = await response.json();
        const attendanceSelect = document.getElementById("subjectSelect_Attendance");

        attendanceInfo.forEach((attendance, index) => {
            const option = document.createElement("option");
            option.value = index;
            option.textContent = attendance.Subject_Name;
            attendanceSelect.appendChild(option);
        });

        updateAttendanceDetails(attendanceInfo[0]);
        attendanceSelect.addEventListener("change", function () {
            updateAttendanceDetails(attendanceInfo[this.value]);
        });
    } catch (error) {
        console.error("Error loading attendance details:", error);
    }
}

function updateAttendanceDetails(attendanceInfo) {
    const container = document.getElementById("attendanceInfoContainer");
    container.innerHTML = `
        <p><strong>Classes Done:</strong> ${attendanceInfo.Classes_Done}</p>
        <p><strong>Classes Attended:</strong> ${attendanceInfo.Classes_Attended}</p>
        <p><strong>Classes Absent:</strong> ${attendanceInfo.Classes_Done - attendanceInfo.Classes_Attended}</p>
    `;
}

async function loadFeesDetails(studentID) {
    try {
        const response = await fetch(`http://localhost:8080/sms/${studentID}/fees`);
        if (!response.ok) {
            console.log("Could not fetch fees data!");
            return;
        }

        const feesInfo = await response.json();
        const container = document.getElementById("feesInfoContainer");
        
        if (!feesInfo?.length) {
            container.innerHTML = '<p>No fees information available</p>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'fees-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Fee Description</th>
                    <th>Amount (Rs.)</th>
                    <th>Status</th>
                    <th>Due Date</th>
                </tr>
            </thead>
            <tbody>
                ${feesInfo.map(fee => `
                    <tr>
                        <td>${fee.Fees_Type}</td>
                        <td>₹${fee.Amount}</td>
                        <td class="${fee.Status === "Pending" ? "status-pending" : "status-paid"}">${fee.Status}</td>
                        <td>${fee.Due_Date.substring(0, 10)}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        
        container.innerHTML = '';
        container.appendChild(table);
    } catch (error) {
        console.error("Error loading fees details:", error);
        document.getElementById("feesInfoContainer").innerHTML = '<p>Error loading fees information</p>';
    }
}

async function loadTeacherData(studentID) {
    try {
        const response = await fetch(`http://localhost:8080/sms/${studentID}/teachers`);
        if (!response.ok) {
            console.log("Could not fetch teacher data!");
            return;
        }

        const teachers = await response.json();
        const teacherInfoContainer = document.getElementById('teacherInfoContainer');
        
        if (!teachers?.length) {
            teacherInfoContainer.innerHTML = '<p>No teacher information available</p>';
            return;
        }

        teacherInfoContainer.innerHTML = teachers.map(teacher => `
            <div class="teacher-card">
                <h3>${teacher.Subject_Name}</h3>
                <p><strong>Name:</strong> ${teacher.name}</p>
                <p><strong>Email:</strong> ${teacher.email}</p>
                <p><strong>Contact:</strong> ${teacher.phone}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error("Error loading teacher data:", error);
        document.getElementById('teacherInfoContainer').innerHTML = '<p>Error loading teacher information</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new StudentFunctions();
    const studentID = localStorage.getItem('loggedInUser');
    if (studentID) {
        loadGuardianData(studentID);
        loadTestDetails(studentID);
        loadAttendanceDetails(studentID);
        loadFeesDetails(studentID);
        loadTeacherData(studentID);
    }
});

window.addEventListener("beforeunload", (event) => {
    if (event.persisted === false) {
        localStorage.clear();
    }
});