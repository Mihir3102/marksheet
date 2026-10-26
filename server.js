
const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MySQL database connection
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'marksheet_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Subjects used in the marksheet
const subjects = [
    'Mathematics',
    'English',
    'Science',
    'Computer Science',
    'Social Science'
];

// Calculate total, percentage, grade and result
function calculate(marks) {
    const values = subjects.map(subject => marks[subject]);

    if (
        values.some(
            mark => !Number.isInteger(mark) || mark < 0 || mark > 100
        )
    ) {
        throw new Error(
            'Each subject mark must be a whole number between 0 and 100.'
        );
    }

    const total = values.reduce((sum, mark) => sum + mark, 0);
    const percentage = Number((total / subjects.length).toFixed(2));

    const result = values.every(mark => mark >= 35) ? 'PASS' : 'FAIL';

    let grade;

    if (result === 'FAIL') {
        grade = 'F';
    } else if (percentage >= 90) {
        grade = 'A+';
    } else if (percentage >= 80) {
        grade = 'A';
    } else if (percentage >= 70) {
        grade = 'B+';
    } else if (percentage >= 60) {
        grade = 'B';
    } else if (percentage >= 50) {
        grade = 'C';
    } else {
        grade = 'D';
    }

    return { total, percentage, grade, result };
}

// Save a marksheet
app.post('/api/marksheets', async (req, res) => {
    try {
        const {
            roll_no,
            student_name,
            class_name,
            semester,
            department,
            marks
        } = req.body;

        const details = [
            roll_no,
            student_name,
            class_name,
            semester,
            department
        ];

        if (
            details.some(
                value =>
                    typeof value !== 'string' ||
                    !value.trim() ||
                    value.trim().length > 100
            ) ||
            !/^[A-Za-z0-9-]{1,30}$/.test(roll_no)
        ) {
            return res.status(400).json({
                error: 'Enter valid student details and a roll number containing letters, numbers or hyphens.'
            });
        }

        if (
            !marks ||
            typeof marks !== 'object' ||
            Array.isArray(marks)
        ) {
            return res.status(400).json({
                error: 'Marks are required.'
            });
        }

        const calculated = calculate(marks);

        const sql = `
            INSERT INTO marksheets
            (
                roll_no, student_name, class_name, semester,
                department, marks, total, percentage, grade, result
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            roll_no.trim(),
            student_name.trim(),
            class_name.trim(),
            semester.trim(),
            department.trim(),
            JSON.stringify(marks),
            calculated.total,
            calculated.percentage,
            calculated.grade,
            calculated.result
        ];

        const [saved] = await pool.execute(sql, values);

        return res.status(201).json({
            message: 'Marksheet saved successfully.',
            id: saved.insertId,
            ...calculated
        });

    } catch (error) {
        console.error('Error saving marksheet:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                error: 'This roll number already exists.'
            });
        }

        if (
            error.message &&
            error.message.startsWith('Each subject mark')
        ) {
            return res.status(400).json({
                error: error.message
            });
        }

        return res.status(500).json({
            error: 'Unable to save marksheet. Check the VS Code terminal for the database error.'
        });
    }
});

// Retrieve a saved marksheet using roll number
app.get('/api/marksheets/:roll', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM marksheets WHERE roll_no = ?',
            [req.params.roll]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                error: 'No marksheet found for this roll number.'
            });
        }

        return res.json(rows[0]);

    } catch (error) {
        console.error('Error retrieving marksheet:', error);

        return res.status(500).json({
            error: 'Unable to retrieve marksheet. Check the VS Code terminal.'
        });
    }
});

// Check database connection
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');

        return res.json({
            server: 'running',
            database: 'connected'
        });
    } catch (error) {
        console.error('Database connection failed:', error);

        return res.status(500).json({
            server: 'running',
            database: 'disconnected',
            error: error.code || 'UNKNOWN_ERROR'
        });
    }
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Open http://localhost:${PORT}`);
});
