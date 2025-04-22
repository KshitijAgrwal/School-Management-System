import mysql from 'mysql2'

const pool = mysql.createPool({
    host: 'your ip',
    user: 'root',
    password: 'your password',
    database: 'sms'
}).promise()

// Student functions
export async function getStudentInfo(studentID, field) {
    const query = `SELECT ${field} FROM student WHERE Student_ID = ?`;
    const [rows] = await pool.query(query, [studentID]);
    return rows;
}

// Guardian functions
export async function getGuardianInfo(studentID) {
    const [guardians, relations] = await Promise.all([
        pool.query("SELECT * FROM Guardian WHERE Guardian_ID IN (SELECT Guardian_ID FROM Guardian_Student WHERE Student_ID = ?)", [studentID]),
        pool.query("SELECT Relation_Type FROM Guardian_Student WHERE Student_ID = ?", [studentID])
    ]);
    return { guardians: guardians[0], relations: relations[0] };
}

// Test functions
export async function getTestInfo(studentID) {
    const [tests, marks] = await Promise.all([
        pool.query("SELECT Test_Type, Max_Marks FROM test WHERE Test_ID IN (SELECT Test_ID FROM Student_Score WHERE Student_ID = ?)", [studentID]),
        pool.query("SELECT Marks_Obtained FROM Student_Score WHERE Student_ID = ?", [studentID])
    ]);
    return { tests: tests[0], marks: marks[0] };
}

export async function checkExists(table, idField, id) {
    const query = `SELECT ${idField} FROM ${table} WHERE ${idField} = ?`;
    const [rows] = await pool.query(query, [id]);
    return rows.length > 0;
}

export async function manageTestMarks(studentID, testID, marksObtained) {
    const updateQuery = "UPDATE Student_Score SET Marks_Obtained = ? WHERE Student_ID = ? AND Test_ID = ?";
    const [updateResult] = await pool.query(updateQuery, [marksObtained, studentID, testID]);
    
    if (updateResult.affectedRows === 0) {
        const insertQuery = "INSERT INTO Student_Score VALUES(?, ?, ?)";
        await pool.query(insertQuery, [studentID, testID, marksObtained]);
    }
    return updateResult;
}

// Attendance function
export async function getAttendance(studentID) {
    const query = "SELECT a.Subject_ID, Subject_Name, Classes_Done, Classes_Attended FROM Attendance a JOIN Subject s ON a.Subject_ID=s.Subject_ID WHERE Student_ID = ?";
    const [rows] = await pool.query(query, [studentID]);
    return rows;
}

// Fees function
export async function getFees(studentID) {
    const query = "SELECT Fees_Type, Amount, Status, Due_Date FROM Fees WHERE Student_ID = ?";
    const [rows] = await pool.query(query, [studentID]);
    return rows;
}

// Teacher functions
export async function getTeacherInfo(teacherID, field) {
    const query = `SELECT ${field} FROM Teacher WHERE Teacher_ID = ?`;
    const [rows] = await pool.query(query, [teacherID]);
    return rows;
}

// Admin functions
export async function enrollStudent(studentID, name, DOB, gender, pass, classID) {
    const query = "INSERT INTO student VALUES(?, ?, ?, ?, ?, ?)";
    const [rows] = await pool.query(query, [studentID, name, DOB, gender, pass, classID]);
    return rows;
}

export async function getAdminInfo(adminID, field) {
    const query = `SELECT ${field} FROM Admin WHERE Admin_ID = ?`;
    const [rows] = await pool.query(query, [adminID]);
    return rows;
}

// Inventory functions
export async function manageInventory(itemId, itemName, quantity) {
    if (itemId) {
        const query = "UPDATE Inventory SET Quantity = ? WHERE Item_ID = ?";
        await pool.query(query, [quantity, itemId]);
    } else {
        const query = "INSERT INTO Inventory (item_name, quantity) VALUES (?, ?)";
        await pool.query(query, [itemName, quantity]);
    }
}

export async function getInventoryItems() {
    const [rows] = await pool.query("SELECT * FROM Inventory");
    return rows;
}

export async function getStudentTeachers(studentID) {
    try {
        const query = `
            SELECT t.name, t.email, t.phone, s.Subject_Name
            FROM teacher t
            JOIN teacher_subject ts ON t.Teacher_ID = ts.Teacher_ID
            JOIN subject s ON ts.Subject_ID = s.Subject_ID
            WHERE t.Teacher_ID IN (
                SELECT tc.Teacher_ID
                FROM teacher_class tc
                WHERE tc.Class_ID IN (
                    SELECT st.Class_ID 
                    FROM student st 
                    WHERE st.Student_ID = ?
                )
            )
        `;
        const [rows] = await pool.query(query, [studentID]);
        return rows;
    } catch (error) {
        console.error('Error fetching student teachers:', error);
        throw error;
    }
}

export async function updateAttendance(studentID, subjectID, status) {
    try {
        // First check if attendance record exists
        const checkQuery = "SELECT * FROM Attendance WHERE Student_ID = ? AND Subject_ID = ?";
        const [existingRecords] = await pool.query(checkQuery, [studentID, subjectID]);
        
        if (existingRecords.length === 0) {
            // Insert new record
            const insertQuery = "INSERT INTO Attendance (Student_ID, Subject_ID, Classes_Done, Classes_Attended) VALUES (?, ?, 1, ?)";
            const classesAttended = status === 'present' ? 1 : 0;
            await pool.query(insertQuery, [studentID, subjectID, classesAttended]);
        } else {
            // Update existing record
            const updateQuery = `
                UPDATE Attendance 
                SET Classes_Done = Classes_Done + 1,
                    Classes_Attended = Classes_Attended + ?
                WHERE Student_ID = ? AND Subject_ID = ?
            `;
            const classesAttended = status === 'present' ? 1 : 0;
            await pool.query(updateQuery, [classesAttended, studentID, subjectID]);
        }
        
        return { success: true };
    } catch (error) {
        console.error('Error updating attendance:', error);
        throw error;
    }
}

// Library functions
export async function addBook(bookID, title, author, quantity) {
    const query = "INSERT INTO book VALUES(?, ?, ?, ?)";
    const [rows] = await pool.query(query, [bookID, title, author, quantity]);
    return rows;
}

export async function removeBook(bookID) {
    const query = "DELETE FROM book WHERE Book_ID = ?";
    const [rows] = await pool.query(query, [bookID]);
    return rows;
}

export async function issueBook(studentID, bookID) {
    const checkQuery = "SELECT Quantity FROM book WHERE Book_ID = ?";
    const [book] = await pool.query(checkQuery, [bookID]);
    
    if (!book.length || book[0].Quantity <= 0) {
        throw new Error("Book not available");
    }

    // Check if student exists
    const [studentRows] = await pool.query("SELECT Student_ID FROM student WHERE Student_ID = ?", [studentID]);
    if (studentRows.length === 0) {
        throw new Error("Student does not exist");
    }

    // Check if student already has this book
    const checkIssueQuery = "SELECT * FROM Book_Issue WHERE Student_ID = ? AND Book_ID = ?";
    const [existingIssue] = await pool.query(checkIssueQuery, [studentID, bookID]);
    if (existingIssue.length > 0) {
        throw new Error("Student already has this book");
    }

    // Insert issue record
    const issueDate = new Date().toISOString().split('T')[0];
    const issueQuery = "INSERT INTO Book_Issue VALUES (?, ?, ?)";
    await pool.query(issueQuery, [studentID, bookID, issueDate]);

    // Update book quantity
    const updateQuery = "UPDATE book SET Quantity = Quantity - 1 WHERE Book_ID = ?";
    await pool.query(updateQuery, [bookID]);

    return { success: true };
}

export async function returnBook(studentID, bookID) {
    // Check if issue exists
    const checkQuery = "SELECT * FROM Book_Issue WHERE Student_ID = ? AND Book_ID = ?";
    const [issue] = await pool.query(checkQuery, [studentID, bookID]);
    
    if (!issue.length) {
        throw new Error("No such book issue found");
    }

    // Delete issue record
    const deleteQuery = "DELETE FROM Book_Issue WHERE Student_ID = ? AND Book_ID = ?";
    await pool.query(deleteQuery, [studentID, bookID]);

    // Update book quantity
    const updateQuery = "UPDATE book SET Quantity = Quantity + 1 WHERE Book_ID = ?";
    await pool.query(updateQuery, [bookID]);

    return { success: true };
}

export async function getBooks() {
    const query = "SELECT * FROM book";
    const [rows] = await pool.query(query);
    return rows;
}

export async function getBookIssues() {
    const query = `
        SELECT bi.*, b.Title, b.Author, s.Name as Student_Name 
        FROM Book_Issue bi 
        JOIN book b ON bi.Book_ID = b.Book_ID 
        JOIN student s ON bi.Student_ID = s.Student_ID
    `;
    const [rows] = await pool.query(query);
    return rows;
}

export async function createTest(testName, maxMarks, testDate) {
    try {
        const [result] = await pool.query(
            'INSERT INTO test (Test_Type, Max_Marks, Date_Of_Test) VALUES (?, ?, ?)',
            [testName, maxMarks, testDate]
        );
        return {result};
    } catch (error) {
        throw error;
    }
}

// Timetable functions
export async function addTimetableEntry(teacherID, subjectID, classID, dayOfWeek, startTime, endTime) {
    const query = `
        INSERT INTO timetable (Teacher_ID, Subject_ID, Class_ID, Day_Of_Week, Start_Time, End_Time)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    await pool.query(query, [teacherID, subjectID, classID, dayOfWeek, startTime, endTime]);
    return { success: true };
}

export async function updateTimetableEntry(timetableID, teacherID, subjectID, classID, dayOfWeek, startTime, endTime) {
    const query = `
        UPDATE timetable 
        SET Teacher_ID = ?, Subject_ID = ?, Class_ID = ?, Day_Of_Week = ?, Start_Time = ?, End_Time = ?
        WHERE Timetable_ID = ?
    `;
    await pool.query(query, [teacherID, subjectID, classID, dayOfWeek, startTime, endTime, timetableID]);
    return { success: true };
}

export async function deleteTimetableEntry(timetableID) {
    const query = "DELETE FROM timetable WHERE Timetable_ID = ?";
    await pool.query(query, [timetableID]);
    return { success: true };
}

export async function getTeacherTimetable(teacherID) {
    const query = `
        SELECT t.Timetable_ID, t.Day_Of_Week, t.Start_Time, t.End_Time,
               s.Subject_Name, c.Section
        FROM timetable t
        JOIN subject s ON t.Subject_ID = s.Subject_ID
        JOIN class c ON t.Class_ID = c.Class_ID
        WHERE t.Teacher_ID = ?
        ORDER BY t.Day_Of_Week, t.Start_Time
    `;
    const [rows] = await pool.query(query, [teacherID]);
    return rows;
}

export async function getClassTimetable(classID) {
    const query = `
        SELECT t.Timetable_ID, t.Day_Of_Week, t.Start_Time, t.End_Time,
               s.Subject_Name, te.Name as Teacher_Name
        FROM timetable t
        JOIN subject s ON t.Subject_ID = s.Subject_ID
        JOIN teacher te ON t.Teacher_ID = te.Teacher_ID
        WHERE t.Class_ID = ?
        ORDER BY t.Day_Of_Week, t.Start_Time
    `;
    const [rows] = await pool.query(query, [classID]);
    return rows;
}

