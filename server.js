const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const app = express();
const stringSimilarity = require('string-similarity');

// Middleware
app.use(cors());
app.use(express.json());  // Đổi từ body-parser sang express.json()
app.use('/audio', express.static(path.join(__dirname, 'public/audio')));

console.log("Static audio path:", path.join(__dirname, 'public/audio'));

// Kết nối MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'english'
});

db.connect(err => {
    if (err) throw err;
    console.log('MySQL connected...');
});

// API lấy câu hỏi
app.get("/question/:id", (req, res) => {
    const questionId = req.params.id;
    db.query("SELECT * FROM questions WHERE id = ?", [questionId], (err, result) => {
      if (err) {
        console.error('Error fetching question:', err);
        return res.status(500).send(err);
      }
      console.log('Fetched question:', result);
      res.json(result[0]);
    });
  });

// API xử lý câu trả lời
app.post("/submit-answer", (req, res) => {
    const { questionId, userAnswer } = req.body;

    db.query("SELECT correct_answer FROM questions WHERE id = ?", [questionId], (err, result) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).send(err);
        }

        // Đảm bảo `correct_answer` tồn tại
        const correctAnswer = result[0]?.correct_answer || "";
        if (!correctAnswer) {
            return res.status(404).json({ message: "Câu hỏi không có đáp án đúng!" });
        }

        // Đảm bảo `userAnswer` không undefined
        if (!userAnswer) {
            return res.status(400).json({ message: "Bạn chưa gửi câu trả lời." });
        }

        // So sánh với `stringSimilarity`
        const matchPercentage = stringSimilarity.compareTwoStrings(userAnswer.trim(), correctAnswer.trim()) * 100;

        if (matchPercentage === 100) {
            res.json({ message: "Câu trả lời đúng!" });
        } else {
            res.json({ message: `Câu trả lời sai! Mức độ chính xác: ${matchPercentage.toFixed(2)}%` });
        }
    });
});
// Start server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
