class Student:
    def __init__(self, student_id, name, email, issued_books=None):
        self.student_id = student_id
        self.name = name
        self.email = email
        self.issued_books = issued_books or []

    def issue_book(self, book_id):
        if book_id not in self.issued_books:
            self.issued_books.append(book_id)

    def return_book(self, book_id):
        if book_id not in self.issued_books:
            raise ValueError("This book is not issued to the student.")
        self.issued_books.remove(book_id)

    def to_dict(self):
        return {
            "student_id": self.student_id,
            "name": self.name,
            "email": self.email,
            "issued_books": self.issued_books,
        }

    @staticmethod
    def from_dict(data):
        return Student(
            data["student_id"],
            data["name"],
            data["email"],
            data.get("issued_books", []),
        )
