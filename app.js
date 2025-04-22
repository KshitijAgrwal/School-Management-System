import express from 'express';
import cors from 'cors';
import {
    getStudentInfo, getGuardianInfo, getStudentTeachers, 
    getTestInfo,getAttendance, getFees,

    getTeacherInfo, manageTestMarks, updateAttendance, 
    getTeacherTimetable, 
    
    enrollStudent, manageInventory, getInventoryItems, checkExists, getAdminInfo, 
    addBook, removeBook, issueBook, returnBook, getBooks, getBookIssues,
    createTest, addTimetableEntry, updateTimetableEntry, deleteTimetableEntry,
    getClassTimetable

} from './database.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/sms/library/books", async (req, res) => {
    try {
        const books = await getBooks();
        res.status(200).json(books);
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ error: error.message || "Something went wrong" });
    }
});

app.get("/sms/library/issues", async (req, res) => {
    try {
        const issues = await getBookIssues();
        res.status(200).json(issues);
    } catch (error) {
        console.error('Error fetching issues:', error);
        res.status(500).json({ error: error.message || "Something went wrong" });
    }
});

app.post("/sms/library/addBook", async (req, res) => {
    const { bookID, title, author, quantity } = req.body;
    try {
        if (await checkExists('book', 'Book_ID', bookID)) {
            return res.status(400).json({ error: "Book ID already exists" });
        }
        const result = await addBook(bookID, title, author, quantity);
        res.status(201).json({ message: "Book added successfully", data: result });
    } catch (error) {
        console.error('Error adding book:', error);
        res.status(500).json({ error: error.message || "Something went wrong" });
    }
});

app.delete("/sms/library/removeBook/:bookID", async (req, res) => {
    const { bookID } = req.params;
    try {
        if (!await checkExists('book', 'Book_ID', bookID)) {
            return res.status(404).json({ error: "Book not found" });
        }
        const result = await removeBook(bookID);
        res.status(200).json({ message: "Book removed successfully", data: result });
    } catch (error) {
        console.error('Error removing book:', error);
        res.status(500).json({ error: error.message || "Something went wrong" });
    }
});

app.post("/sms/library/issueBook", async (req, res) => {
    const { studentID, bookID } = req.body;
    try {
        const result = await issueBook(studentID, bookID);
        res.status(200).json({ message: "Book issued successfully", data: result });
    } catch (error) {
        console.error('Error issuing book:', error);
        res.status(400).json({ error: error.message || "Something went wrong" });
    }
});

app.post("/sms/library/returnBook", async (req, res) => {
    const { studentID, bookID } = req.body;
    try {
        const result = await returnBook(studentID, bookID);
        res.status(200).json({ message: "Book returned successfully", data: result });
    } catch (error) {
        console.error('Error returning book:', error);
        res.status(400).json({ error: error.message || "Something went wrong" });
    }
});

// Get teachers for a student
app.get('/sms/:studentID/teachers', async (req, res) => {
    try {
        const teachers = await getStudentTeachers(req.params.studentID);
        res.json(teachers);
    } catch (error) {
        console.error('Error in /sms/:studentID/teachers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Student routes
app.get("/sms/:username/:field/student", async (req, res) => {
    try {
        const rows = await getStudentInfo(req.params.username, req.params.field);
        if (rows.length === 0) return res.status(404).json({ error: "User not found" });
        res.send(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message || "Something went wrong" });
    }
});

app.get("/sms/:username/guardian", async (req, res) => {
    try {
        const { guardians, relations } = await getGuardianInfo(req.params.username);
        if (guardians.length === 0) return res.status(404).json({ error: "Guardian not found" });
        res.send({ guardians, relations });
    } catch (err) {
        res.status(500).json({ error: err.message || "Something went wrong" });
    }
});

app.get("/sms/:username/test", async (req, res) => {
    try {
        const { tests, marks } = await getTestInfo(req.params.username);
        if (tests.length === 0) return res.status(404).json({ error: "No Tests given by student!" });
        res.send({ tests, marks });
    } catch (err) {
        res.status(500).json({ error: err.message || "Something went wrong" });
    }
});

app.get("/sms/:username/:field", async (req, res) => {
    try {
        const { username, field } = req.params;
        let data;
        
        switch(field) {
            case 'attendance':
                data = await getAttendance(username);
                break;
            case 'fees':
                data = await getFees(username);
                break;
            default:
                return res.status(400).json({ error: "Invalid field specified" });
        }
        
        res.send(data);
    } catch (err) {
        res.status(500).json({ error: err.message || "Something went wrong" });
    }
});

// Teacher routes
app.get("/sms/:username/:field/teacher", async (req, res) => {
    try {
        const rows = await getTeacherInfo(req.params.username, req.params.field);
        if (rows.length === 0) return res.status(404).json({ error: "User not found" });
        res.send(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message || "Something went wrong" });
    }
});

app.post("/sms/testMarks", async (req, res) => {
    const { studentID, testID, marksObtained } = req.body;
    try {
        if (!await checkExists('student', 'Student_ID', studentID)) {
            return res.status(404).json({ error: "Student does not exist" });
        }
        if (!await checkExists('test', 'Test_ID', testID)) {
            return res.status(404).json({ error: "Test does not exist" });
        }
        
        const result = await manageTestMarks(studentID, testID, marksObtained);
        res.status(result.affectedRows ? 200 : 201).json({
            message: result.affectedRows ? "Marks updated successfully" : "Marks inserted successfully",
            result
        });
    } catch (error) {
        res.status(500).json({ error: error.message || "Something went wrong" });
    }
});

app.post("/sms/updateAttendance", async (req, res) => {
    const { studentID, subjectID, status } = req.body;
    try {
        if (!await checkExists('student', 'Student_ID', studentID)) {
            return res.status(404).json({ error: "Student does not exist" });
        }
        if (!await checkExists('subject', 'Subject_ID', subjectID)) {
            return res.status(404).json({ error: "Subject does not exist" });
        }
        
        await updateAttendance(studentID, subjectID, status);
        res.status(200).json({ message: "Attendance updated successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message || "Something went wrong" });
    }
});

// Admin routes
app.post("/sms/enrollStudent", async (req, res) => {
    const { studentID, name, DOB, gender, pass, classID } = req.body;
    try {
        const result = await enrollStudent(studentID, name, DOB, gender, pass, classID);
        res.status(201).json({ message: "Student enrolled successfully", result });
    } catch (error) {
        res.status(500).json({ error: error.message || "Something went wrong" });
    }
});

// Inventory routes
app.post("/sms/inventory", async (req, res) => {
    try {
        const { itemId, itemName, quantity } = req.body;
        await manageInventory(itemId, itemName, quantity);
        res.status(201).json({ message: "Inventory updated successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message || "Error managing inventory" });
    }
});

app.get("/sms/inventory", async (req, res) => {
    try {
        const items = await getInventoryItems();
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message || "Error fetching inventory" });
    }
});

app.get("/sms/:username/:field/admin", async (req, res) => {
    try {
        const rows = await getAdminInfo(req.params.username, req.params.field);
        if (rows.length === 0) return res.status(404).json({ error: "User not found" });
        res.send(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message || "Something went wrong" });
    }
});

// Create Test endpoint
app.post("/sms/createTest", async (req, res) => {
    const { testName, maxMarks, testDate } = req.body;
    try {
        const result = await createTest(testName, maxMarks, testDate);
        res.status(201).json({ message: "Test created successfully", data: result });
    } catch (error) {
        console.error('Error creating test:', error);
        res.status(400).json({ error: error.message || "Something went wrong" });
    }
});

// Timetable routes
app.post("/sms/timetable/add", async (req, res) => {
    const { teacherID, subjectID, classID, dayOfWeek, startTime, endTime } = req.body;
    try {
        const result = await addTimetableEntry(teacherID, subjectID, classID, dayOfWeek, startTime, endTime);
        res.status(201).json({ message: "Timetable entry added successfully", data: result });
    } catch (error) {
        console.error('Error adding timetable entry:', error);
        res.status(500).json({ error: error.message || "Something went wrong" });
    }
});

app.put("/sms/timetable/update/:timetableID", async (req, res) => {
    const { timetableID } = req.params;
    const { teacherID, subjectID, classID, dayOfWeek, startTime, endTime } = req.body;
    try {
        const result = await updateTimetableEntry(timetableID, teacherID, subjectID, classID, dayOfWeek, startTime, endTime);
        res.status(200).json({ message: "Timetable entry updated successfully", data: result });
    } catch (error) {
        console.error('Error updating timetable entry:', error);
        res.status(500).json({ error: error.message || "Something went wrong" });
    }
});

app.delete("/sms/timetable/delete/:timetableID", async (req, res) => {
    const { timetableID } = req.params;
    try {
        const result = await deleteTimetableEntry(timetableID);
        res.status(200).json({ message: "Timetable entry deleted successfully", data: result });
    } catch (error) {
        console.error('Error deleting timetable entry:', error);
        res.status(500).json({ error: error.message || "Something went wrong" });
    }
});

app.get("/sms/timetable/teacher/:teacherID", async (req, res) => {
    try {
        const timetable = await getTeacherTimetable(req.params.teacherID);
        res.status(200).json(timetable);
    } catch (error) {
        console.error('Error fetching teacher timetable:', error);
        res.status(500).json({ error: error.message || "Something went wrong" });
    }
});

app.get("/sms/timetable/class/:classID", async (req, res) => {
    const { classID } = req.params;
    try {
        const timetable = await getClassTimetable(classID);
        res.status(200).json(timetable);
    } catch (error) {
        console.error('Error fetching class timetable:', error);
        res.status(500).json({ error: error.message || "Something went wrong" });
    }
});

app.listen(8080, () => console.log('Server started on http://localhost:8080/sms'));