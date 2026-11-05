# Library Management System

A simple college-level Library Management System built with:

- Python
- Flask
- HTML
- CSS
- JavaScript
- JSON file storage
- Object-Oriented Programming

## Main Features

1. Dashboard
2. 100 preloaded educational books
3. Search books by title/author
4. Filter books by education domain
5. Add new books
6. Add students
7. Issue books
8. Return books
9. Simple overdue fine calculation
10. Statistics
11. JSON data persistence
12. Exception/error handling

## Educational Domains

The 100 books are divided across 10 domains, with 10 books in each:

- Computer Science
- Information Technology
- Mathematics
- Physics
- Chemistry
- Biology
- Business & Management
- Economics
- Engineering
- Humanities & Social Science

## Fine Rule

A student gets 14 days to keep a book.

After 14 days:

₹5 per overdue day

## Project Structure

LibraryManagementSystem/
│
├── app.py
├── book.py
├── student.py
├── library.py
├── requirements.txt
│
├── data/
│   ├── books.json
│   ├── students.json
│   └── transactions.json
│
├── templates/
│   └── index.html
│
└── static/
    ├── style.css
    └── script.js

## How to Run

Open the project folder in VS Code.

Create/activate a virtual environment if desired:

Windows:

python -m venv venv
venv\Scripts\activate

Install Flask:

pip install -r requirements.txt

Run:

python app.py

Then open:

http://127.0.0.1:5000

## College Project Concepts Used

### Python
- Variables
- if/else
- loops
- lists
- dictionaries
- functions
- exceptions
- file handling
- JSON
- classes and objects

### OOP Classes
- Book
- Student
- Library

### Web
- HTML
- CSS
- JavaScript
- Flask routes
- REST-style API endpoints

This project is intentionally kept at college-project level rather than using databases, authentication systems, cloud deployment, or advanced enterprise architecture.
