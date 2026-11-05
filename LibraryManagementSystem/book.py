class Book:
    def __init__(self, book_id, title, author, domain,
                 is_issued=False, issued_to=None, issue_count=0):
        self.book_id = book_id
        self.title = title
        self.author = author
        self.domain = domain
        self.is_issued = is_issued
        self.issued_to = issued_to
        self.issue_count = issue_count

    def issue(self, student_id):
        if self.is_issued:
            raise ValueError("Book is already issued.")
        self.is_issued = True
        self.issued_to = student_id
        self.issue_count += 1

    def return_book(self):
        if not self.is_issued:
            raise ValueError("Book is not issued.")
        self.is_issued = False
        self.issued_to = None

    def to_dict(self):
        return {
            "book_id": self.book_id,
            "title": self.title,
            "author": self.author,
            "domain": self.domain,
            "is_issued": self.is_issued,
            "issued_to": self.issued_to,
            "issue_count": self.issue_count
        }

    @staticmethod
    def from_dict(data):
        return Book(
            data["book_id"],
            data["title"],
            data["author"],
            data["domain"],
            data.get("is_issued", False),
            data.get("issued_to"),
            data.get("issue_count", 0),
        )
