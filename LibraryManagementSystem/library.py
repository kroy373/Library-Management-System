import json
import os
from datetime import date, datetime

from book import Book
from student import Student


class Library:
    def __init__(self):
        self.data_dir = os.path.join(
                os.path.dirname(os.path.abspath(__file__)),
                "data"
        )
        self.books_file = os.path.join(self.data_dir, "books.json")
        self.students_file = os.path.join(self.data_dir, "students.json")
        self.transactions_file = os.path.join(self.data_dir, "transactions.json")

        os.makedirs(self.data_dir, exist_ok=True)

        self.books = {}
        self.students = {}
        self.transactions = []

        self.load_data()

    def load_data(self):
        self.books = {}
        self.students = {}
        self.transactions = []

        if os.path.exists(self.books_file):
            with open(self.books_file, "r", encoding="utf-8") as f:
                for item in json.load(f):
                    book = Book.from_dict(item)
                    self.books[book.book_id] = book

        if os.path.exists(self.students_file):
            with open(self.students_file, "r", encoding="utf-8") as f:
                for item in json.load(f):
                    student = Student.from_dict(item)
                    self.students[student.student_id] = student

        if os.path.exists(self.transactions_file):
            with open(self.transactions_file, "r", encoding="utf-8") as f:
                self.transactions = json.load(f)

    def save_data(self):
        with open(self.books_file, "w", encoding="utf-8") as f:
            json.dump([b.to_dict() for b in self.books.values()], f, indent=4)

        with open(self.students_file, "w", encoding="utf-8") as f:
            json.dump([s.to_dict() for s in self.students.values()], f, indent=4)

        with open(self.transactions_file, "w", encoding="utf-8") as f:
            json.dump(self.transactions, f, indent=4)

    def search_books(self, keyword="", domain=""):
        results = []

        for book in self.books.values():
            text_match = (
                not keyword
                or keyword in book.title.lower()
                or keyword in book.author.lower()
            )
            domain_match = not domain or book.domain == domain

            if text_match and domain_match:
                results.append(book.to_dict())

        return results

    def add_book(self, title, author, domain):
        title = title.strip()
        author = author.strip()
        domain = domain.strip()

        if not title or not author or not domain:
            raise ValueError("Title, author and domain are required.")

        new_id = self._next_book_id()
        book = Book(new_id, title, author, domain)
        self.books[new_id] = book
        self.save_data()
        return book.to_dict()

    def add_student(self, name, email):
        name = name.strip()
        email = email.strip()

        if not name or not email:
            raise ValueError("Student name and email are required.")

        new_id = self._next_student_id()
        student = Student(new_id, name, email)
        self.students[new_id] = student
        self.save_data()
        return student.to_dict()

    def issue_book(self, book_id, student_id):
        if book_id not in self.books:
            raise ValueError("Invalid book ID.")

        if student_id not in self.students:
            raise ValueError("Invalid student ID.")

        book = self.books[book_id]
        student = self.students[student_id]

        if book.is_issued:
            raise ValueError("This book is already issued.")

        book.issue(student.student_id)
        student.issue_book(book.book_id)

        transaction = {
            "book_id": book.book_id,
            "student_id": student.student_id,
            "issue_date": date.today().isoformat(),
            "return_date": None,
            "fine": 0,
        }

        self.transactions.append(transaction)
        self.save_data()
        return transaction

    def return_book(self, book_id):
        if book_id not in self.books:
            raise ValueError("Invalid book ID.")

        book = self.books[book_id]

        if not book.is_issued:
            raise ValueError("This book is not currently issued.")

        student_id = book.issued_to
        student = self.students[student_id]

        transaction = self._active_transaction(book_id)
        fine = self.calculate_fine(transaction["issue_date"])

        book.return_book()
        student.return_book(book_id)

        transaction["return_date"] = date.today().isoformat()
        transaction["fine"] = fine

        self.save_data()

        return {
            "book_id": book_id,
            "student_id": student_id,
            "fine": fine,
            "days_allowed": 14,
        }

    def calculate_fine(self, issue_date):
        issued = datetime.strptime(issue_date, "%Y-%m-%d").date()
        days = (date.today() - issued).days
        overdue_days = max(0, days - 14)
        return overdue_days * 5

    def _active_transaction(self, book_id):
        for transaction in reversed(self.transactions):
            if transaction["book_id"] == book_id and transaction["return_date"] is None:
                return transaction
        raise ValueError("Active transaction not found.")

    def _next_book_id(self):
        numbers = []
        for book_id in self.books:
            if book_id.startswith("B") and book_id[1:].isdigit():
                numbers.append(int(book_id[1:]))
        return f"B{max(numbers, default=0) + 1:03d}"

    def _next_student_id(self):
        numbers = []
        for student_id in self.students:
            if student_id.startswith("S") and student_id[1:].isdigit():
                numbers.append(int(student_id[1:]))
        return f"S{max(numbers, default=0) + 1:03d}"

    def get_students(self):
        return [s.to_dict() for s in self.students.values()]

    def get_statistics(self):
        total = len(self.books)
        issued = sum(1 for b in self.books.values() if b.is_issued)
        available = total - issued

        most_issued = None
        if self.books:
            book = max(self.books.values(), key=lambda b: b.issue_count)
            if book.issue_count > 0:
                most_issued = {
                    "title": book.title,
                    "issue_count": book.issue_count,
                }

        return {
            "total_books": total,
            "available_books": available,
            "issued_books": issued,
            "total_students": len(self.students),
            "total_transactions": len(self.transactions),
            "most_issued": most_issued,
        }
