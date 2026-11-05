const domains = [
    "Computer Science",
    "Information Technology",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Business & Management",
    "Economics",
    "Engineering",
    "Humanities & Social Science"
];

function showSection(id, button) {
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active-section"));
    document.getElementById(id).classList.add("active-section");

    document.querySelectorAll(".nav").forEach(n => n.classList.remove("active"));
    if (button) button.classList.add("active");

    if (id === "books") loadBooks();
    if (id === "students") loadStudents();
    if (id === "transactions") loadTransactionOptions();
    if (id === "dashboard") loadStats();
    document.getElementById("sidebar").classList.remove("open");
}

function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("open");
}

function openModal(id) {
    document.getElementById(id).classList.add("show");
}

function closeModal(id) {
    document.getElementById(id).classList.remove("show");
}

function toast(message) {
    const box = document.getElementById("toast");
    box.textContent = message;
    box.style.display = "block";
    setTimeout(() => box.style.display = "none", 2500);
}

async function loadBooks() {
    const search = document.getElementById("bookSearch").value;
    const domain = document.getElementById("domainFilter").value;

    const response = await fetch(
        `/api/books?search=${encodeURIComponent(search)}&domain=${encodeURIComponent(domain)}`
    );
    const books = await response.json();

    const table = document.getElementById("booksTable");

    if (!books.length) {
        table.innerHTML = `<tr><td colspan="5">No books found.</td></tr>`;
        return;
    }

    table.innerHTML = books.map(book => `
        <tr>
            <td>${book.book_id}</td>
            <td>${escapeHtml(book.title)}</td>
            <td>${escapeHtml(book.author)}</td>
            <td>${escapeHtml(book.domain)}</td>
            <td>
                <span class="badge ${book.is_issued ? "issued" : "available"}">
                    ${book.is_issued ? "Issued" : "Available"}
                </span>
            </td>
        </tr>
    `).join("");
}

async function loadStudents() {
    const response = await fetch("/api/students");
    const students = await response.json();
    const search = document.getElementById("studentSearch").value.trim().toLowerCase();
    const filteredStudents = search
        ? students.filter(student => student.student_id.toLowerCase().includes(search))
        : students;

    const table = document.getElementById("studentsTable");

    if (!filteredStudents.length) {
        table.innerHTML = search
            ? `<tr><td colspan="4">No students found for ID “${escapeHtml(search)}”.</td></tr>`
            : `<tr><td colspan="4">No students registered.</td></tr>`;
        return;
    }

    table.innerHTML = filteredStudents.map(student => `
        <tr>
            <td>${student.student_id}</td>
            <td>${escapeHtml(student.name)}</td>
            <td>${escapeHtml(student.email)}</td>
            <td>${student.issued_books.length}</td>
        </tr>
    `).join("");
}

async function loadTransactionOptions() {
    const [booksResponse, studentsResponse] = await Promise.all([
        fetch("/api/books"), fetch("/api/students")
    ]);
    const books = await booksResponse.json();
    const students = await studentsResponse.json();
    const availableBooks = books.filter(book => !book.is_issued);
    const issuedBooks = books.filter(book => book.is_issued);

    setSelectOptions("issueBookId", availableBooks,
        book => book.book_id, book => `${book.book_id} — ${book.title}`, "No available books");
    setSelectOptions("issueStudentId", students,
        student => student.student_id, student => `${student.student_id} — ${student.name}`, "No students registered");
    setSelectOptions("returnBookId", issuedBooks,
        book => book.book_id, book => `${book.book_id} — ${book.title}`, "No issued books");
    updateReturnStudent(issuedBooks, students);
    document.getElementById("returnBookId").onchange = () => updateReturnStudent(issuedBooks, students);
}

function setSelectOptions(id, items, getValue, getLabel, emptyMessage) {
    const select = document.getElementById(id);
    const previous = select.value;
    select.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = items.length ? "Choose an option" : emptyMessage;
    select.appendChild(placeholder);
    items.forEach(item => {
        const option = document.createElement("option");
        option.value = getValue(item);
        option.textContent = getLabel(item);
        select.appendChild(option);
    });
    if (items.some(item => getValue(item) === previous)) select.value = previous;
}

function updateReturnStudent(issuedBooks, students) {
    const bookId = document.getElementById("returnBookId").value;
    const book = issuedBooks.find(item => item.book_id === bookId);
    const student = students.find(item => item.student_id === (book && book.issued_to));
    setSelectOptions("returnStudentId", student ? [student] : [],
        item => item.student_id, item => `${item.student_id} — ${item.name}`,
        book ? "Student not found" : "Choose an issued book first");
}

const chartColors = ["#3288e9", "#43c77a", "#f4cc45", "#f47d63", "#8c6ad8", "#55c7c6", "#f59a42", "#7b78c9", "#ed70a8", "#c6b5df"];

async function loadStats() {
    try {
        const [statsResponse, booksResponse, transactionsResponse] = await Promise.all([
            fetch("/api/stats"), fetch("/api/books"), fetch("/api/transactions")
        ]);
        const stats = await statsResponse.json();
        const books = await booksResponse.json();
        const transactions = await transactionsResponse.json();

        document.getElementById("dashTotal").textContent = stats.total_books;
        document.getElementById("dashAvailable").textContent = stats.available_books;
        document.getElementById("dashIssued").textContent = stats.issued_books;
        document.getElementById("dashStudents").textContent = stats.total_students;
        document.getElementById("dashTransactions").textContent = stats.total_transactions;

        renderDomainChart(books);
        renderStatusChart(stats.available_books, stats.issued_books, stats.total_books);
        renderPopularBooks(books);
        renderRecentTransactions(transactions.slice(0, 5));
    } catch (error) {
        console.error("Unable to load dashboard data:", error);
    }
}

function renderDomainChart(books) {
    const counts = domains.map(domain => ({
        name: domain,
        count: books.filter(book => book.domain === domain).length
    }));
    const total = books.length;
    let cursor = 0;
    const stops = counts.map((item, index) => {
        const start = cursor;
        cursor += total ? item.count / total * 100 : 0;
        return `${chartColors[index]} ${start}% ${cursor}%`;
    });
    document.getElementById("domainDonut").style.background = total
        ? `conic-gradient(${stops.join(",")})`
        : "#eee5dc";
    document.getElementById("donutTotal").textContent = total;
    document.getElementById("domainLegend").innerHTML = counts.map((item, index) => `
        <div class="legend-item"><span class="legend-dot" style="background:${chartColors[index]}"></span>${escapeHtml(item.name)} (${item.count})</div>
    `).join("");
}

function renderStatusChart(available, issued, total) {
    const max = Math.max(total, 1);
    const availableHeight = Math.max(available ? available / max * 100 : 0, available ? 2 : 0);
    const issuedHeight = Math.max(issued ? issued / max * 100 : 0, issued ? 2 : 0);
    document.getElementById("statusChart").innerHTML = `
        <div class="status-bar-group"><strong class="status-bar-value">${available}</strong><div class="status-bar available-bar" style="height:${availableHeight}%"></div><span class="status-bar-label">Available</span></div>
        <div class="status-bar-group"><strong class="status-bar-value">${issued}</strong><div class="status-bar issued-bar" style="height:${issuedHeight}%"></div><span class="status-bar-label">Issued</span></div>
    `;
}

function renderPopularBooks(books) {
    const popular = books.filter(book => book.issue_count > 0)
        .sort((a, b) => b.issue_count - a.issue_count || a.title.localeCompare(b.title))
        .slice(0, 5);
    const list = document.getElementById("popularBooks");
    if (!popular.length) {
        list.innerHTML = '<li class="empty-state">No books have been issued yet.</li>';
        return;
    }
    list.innerHTML = popular.map((book, index) => `
        <li><span class="rank">${index + 1}</span><span class="popular-title">${escapeHtml(book.title)}</span><span class="popular-count">${book.issue_count} times</span></li>
    `).join("");
}

function renderRecentTransactions(transactions) {
    const body = document.getElementById("recentTransactions");
    if (!transactions.length) {
        body.innerHTML = '<tr><td colspan="8" class="empty-state">No transactions recorded yet.</td></tr>';
        return;
    }
    body.innerHTML = transactions.map((item, index) => `
        <tr><td>${index + 1}</td><td>${escapeHtml(item.book_id)}</td><td>${escapeHtml(item.book_title)}</td><td>${escapeHtml(item.student_id)}</td><td>${escapeHtml(item.student_name)}</td><td>${escapeHtml(item.issue_date || "—")}</td><td>${escapeHtml(item.return_date || "—")}</td><td>₹${Number(item.fine || 0)}</td></tr>
    `).join("");
}

async function submitJSON(url, body) {
    const response = await fetch(url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
    }

    return data;
}

document.getElementById("bookForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
        await submitJSON("/api/books", {
            title: document.getElementById("bookTitle").value,
            author: document.getElementById("bookAuthor").value,
            domain: document.getElementById("bookDomain").value
        });

        e.target.reset();
        closeModal("bookModal");
        toast("Book added successfully.");
        loadBooks();
        loadStats();
    } catch (error) {
        toast(error.message);
    }
});

document.getElementById("studentForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
        await submitJSON("/api/students", {
            name: document.getElementById("studentName").value,
            email: document.getElementById("studentEmail").value
        });

        e.target.reset();
        closeModal("studentModal");
        toast("Student added successfully.");
        loadStudents();
        loadStats();
    } catch (error) {
        toast(error.message);
    }
});

document.getElementById("issueForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
        await submitJSON("/api/issue", {
            book_id: document.getElementById("issueBookId").value.trim(),
            student_id: document.getElementById("issueStudentId").value.trim()
        });

        e.target.reset();
        toast("Book issued successfully.");
        loadBooks();
        loadStudents();
        loadTransactionOptions();
        loadStats();
    } catch (error) {
        toast(error.message);
    }
});

document.getElementById("returnForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
        const result = await submitJSON("/api/return", {
            book_id: document.getElementById("returnBookId").value.trim()
        });

        e.target.reset();
        toast(`Book returned. Fine: ₹${result.result.fine}`);
        loadBooks();
        loadStudents();
        loadTransactionOptions();
        loadStats();
    } catch (error) {
        toast(error.message);
    }
});

function escapeHtml(text) {
    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function populateDomains() {
    const filter = document.getElementById("domainFilter");
    const bookDomain = document.getElementById("bookDomain");

    domains.forEach(domain => {
        filter.insertAdjacentHTML("beforeend", `<option value="${domain}">${domain}</option>`);
        bookDomain.insertAdjacentHTML("beforeend", `<option value="${domain}">${domain}</option>`);
    });
}

populateDomains();
loadTransactionOptions();
loadBooks();
loadStudents();
loadStats();
