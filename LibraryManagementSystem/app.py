from flask import Flask, render_template, request, jsonify
from library import Library

app = Flask(__name__)
library = Library()


@app.route("/")
def index():
    return render_template("index.html")


@app.get("/api/books")
def get_books():
    keyword = request.args.get("search", "").strip().lower()
    domain = request.args.get("domain", "").strip()
    books = library.search_books(keyword, domain)
    return jsonify(books)


@app.get("/api/students")
def get_students():
    return jsonify(library.get_students())


@app.post("/api/books")
def add_book():
    data = request.get_json(silent=True) or {}
    try:
        book = library.add_book(
            data.get("title", ""),
            data.get("author", ""),
            data.get("domain", ""),
        )
        return jsonify({"message": "Book added successfully.", "book": book}), 201
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


@app.post("/api/students")
def add_student():
    data = request.get_json(silent=True) or {}
    try:
        student = library.add_student(
            data.get("name", ""),
            data.get("email", ""),
        )
        return jsonify({"message": "Student added successfully.", "student": student}), 201
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


@app.post("/api/issue")
def issue_book():
    data = request.get_json(silent=True) or {}
    try:
        transaction = library.issue_book(
            data.get("book_id", ""),
            data.get("student_id", ""),
        )
        return jsonify({
            "message": "Book issued successfully.",
            "transaction": transaction,
        })
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


@app.post("/api/return")
def return_book():
    data = request.get_json(silent=True) or {}
    try:
        result = library.return_book(data.get("book_id", ""))
        return jsonify({
            "message": "Book returned successfully.",
            "result": result,
        })
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


@app.get("/api/stats")
def stats():
    return jsonify(library.get_statistics())


@app.get("/api/transactions")
def get_transactions():
    books = library.books
    students = library.students
    rows = []
    for transaction in reversed(library.transactions):
        book = books.get(transaction.get("book_id"))
        student = students.get(transaction.get("student_id"))
        rows.append({
            **transaction,
            "book_title": book.title if book else "Unknown book",
            "student_name": student.name if student else "Unknown student",
        })
    return jsonify(rows)


if __name__ == "__main__":
    app.run(debug=True)