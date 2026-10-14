# StudyFlow: AI-Powered Academic Planner & Workload Balancer
**Course:** CSCI 3509: Intro to Software Engineering  
**Semester:** Fall 2026  
**Instructor:** Kamila Ismayilova  
**Project Team:** Syntax Squad  

*Submitted in partial fulfillment of the requirements of the CSCI 3509: Intro to Software Engineering course project.*

---

## Team Members and Contributions

| Team Member | Contribution to the Homework |
| :--- | :--- |
| **Sumaya Gafarova** | Project proposal ideation, requirement engineering, AI scheduling logic design, and system architecture planning. |
| **Maryam Aliyeva** | Frontend UI/UX design, interactive calendar & dashboard specification, and client-side state management workflows. |
| **Nargiz Bayramova** | Backend REST API design, PostgreSQL database schema modeling, and monitoring & Telegram alerting strategy. |

---

## 1. Project Overview

### Project Description
**StudyFlow (Academic Planner)** is a centralized, AI-enhanced web productivity application engineered to help university students manage multiple courses, assignments, exams, and academic deadlines from a single unified interface. Higher education students frequently struggle with cognitive overload caused by fragmented course syllabi, competing project deadlines, and poor time management, which often leads to procrastination, late submissions, and academic burnout. The system solves this problem by using artificial intelligence to automatically generate personalized, realistic daily study timetables tailored to each student’s actual available hours, task weights, and deadline urgency. Additionally, the platform provides intelligent task prioritization and workload analytics, guiding students on which assignments to tackle first and ensuring a sustainable study-life balance.

### Target Users
* **Undergraduate & Graduate University Students:** Need an effortless, centralized tool to track multi-course deliverables, receive automated day-by-day study plans that fit their personal schedules, and visually monitor their academic progress.
* **Academic Advisors, Mentors, and Tutors:** Need high-level, student-authorized visibility into workload distribution and peak academic crunch periods to provide timely guidance and prevent student burnout.

### Main Features
1. **Centralized Course & Deadline Hub:** Students can catalog all enrolled courses, assignments, exams, and syllabus grading weights in one structured repository.
2. **Real-Time Visual Dashboard:** A consolidated dashboard displays countdowns to upcoming deadlines, daily to-do checklists, and progress indicators for each course.
3. **AI-Powered Dynamic Study Scheduler:** An intelligent scheduling engine analyzes deadline urgency, task effort, and daily free hours to generate realistic, day-by-day study sessions.
4. **AI Task Prioritization & Recommendation:** The system evaluates upcoming deliverables to recommend the optimal sequence of assignments to complete each day.
5. **Dynamic Schedule Rebalancer:** When a student misses a planned session or adds an unexpected deadline, the AI automatically reschedules and rebalances remaining study blocks.
6. **Interactive Multi-View Academic Calendar:** A visual calendar (monthly, weekly, daily) displays scheduled study blocks, class lectures, and submission deadlines with course-specific color coding.
7. **Workload Analytics & Progress Tracking:** Visual meters track completed vs. planned study hours, helping students identify potential bottlenecks before deadlines arrive.

---

## 2. Tech Stack

Your system follows the required architectural principles:
* **Frontend and backend:** Separate frontend and backend decoupled via a clean REST API.
* **Database:** PostgreSQL chosen for relational rigor, ACID guarantees, and JSONB flexibility.
* **User interface:** Modern, responsive, and polished interface designed with React and Tailwind CSS.
* **AI:** Integrated OpenAI GPT-4o-mini engine for structured study planning and priority scoring.
* **Monitoring and alerting:** 100% free monitoring pipeline sending automatic real-time alerts to a private Telegram channel via the Telegram Bot API.

### Technology Selection and Rationale

| Layer | Technology | Why we chose it |
| :--- | :--- | :--- |
| **Frontend (UI)** | React.js, Tailwind CSS, TypeScript | Component-based architecture ideal for dynamic calendars and real-time dashboards; Tailwind CSS provides modern, responsive UI design, leveraging existing team familiarity with TypeScript. |
| **Backend** | Python, FastAPI | High-performance asynchronous REST API framework with native OpenAPI documentation, Pydantic data validation, and seamless integration with Python AI SDKs and background workers. |
| **Database** | PostgreSQL | Academic data (courses, assignments, deadlines, enrollments) is strictly relational requiring ACID transactions and relational integrity; native JSONB support allows efficient storage of dynamic AI study schedules. |
| **AI service / model** | OpenAI GPT-4o-mini | Provides fast, low-latency reasoning and strict compliance with structured JSON schemas, reliably outputting balanced daily study timetables and task priority rankings without formatting errors. |
| **Monitoring & alerting** | Python Logging, Custom Middleware Health Checks, Telegram Bot API | Completely free and lightweight; custom middleware tracks API exceptions, latency, and database connectivity, instantly dispatching markdown alerts to the team's Telegram channel. |
| **Other tools** | GitHub, Figma, Docker, Postman | GitHub manages version control and branching; Figma powers UI/UX prototyping; Docker guarantees consistent multi-platform environments; and Postman streamlines REST API validation. |

---

## 3. Functional Requirements

All functional requirements are formulated using the standard *"The system shall …"* specification and categorized under the MoSCoW prioritization model (**Must**, **Should**, **Could**). Requirements utilizing Artificial Intelligence are explicitly marked with **(AI)**.

| ID | Requirement | Priority |
| :--- | :--- | :--- |
| **FR-01** | The system shall allow students to register, securely log in via email and password (with JWT authentication), and manage their user profiles. | Must |
| **FR-02** | The system shall allow students to create, view, edit, and archive courses with metadata including course code, course title, instructor, and semester. | Must |
| **FR-03** | The system shall allow students to add, edit, and delete academic tasks (assignments, exams, quizzes, and project milestones) with due dates, estimated effort, and syllabus grade weights. | Must |
| **FR-04** | The system shall display a centralized dashboard presenting upcoming deadlines, a daily prioritized task checklist, and visual course completion progress bars. | Must |
| **FR-05** | The system shall allow students to specify their available study hours and blocked time slots for each day of the week. | Must |
| **FR-06 (AI)** | The system shall generate a personalized, balanced study schedule that distributes study blocks across available days leading up to task deadlines. | Must |
| **FR-07 (AI)** | The system shall analyze pending assignments based on deadline proximity, syllabus grade weight, and task complexity to recommend which tasks to complete first. | Must |
| **FR-08 (AI)** | The system shall dynamically adjust and rebalance the study schedule whenever a student misses a planned session, marks a task as incomplete, or adds an unexpected deadline. | Should |
| **FR-09** | The system shall provide an interactive calendar view (monthly, weekly, and daily) showing scheduled study sessions and final deadlines with course-specific color coding. | Should |
| **FR-10** | The system shall allow students to mark study blocks and tasks as completed, automatically updating workload analytics and remaining required study hours. | Should |
| **FR-11** | The system shall allow students to filter and search tasks by course, status (pending, in progress, completed), priority level, and deadline date range. | Should |
| **FR-12** | The system shall allow students to export their academic schedule and deadlines to external calendar formats (e.g., .ics / Google Calendar). | Could |
| **FR-13 (AI)** | The system shall extract course deadlines, exam dates, and assignment details from raw syllabus text or assignment prompts pasted by the student. | Could |
| **FR-14** | The system shall generate visual workload analytics comparing planned vs. actual study hours and warning students of upcoming high-stress workload weeks. | Could |

---

## 4. Monitoring and Alerting

### System Architecture and Bot Token Security
The system continuously monitors application performance, infrastructure health, and third-party integrations using lightweight, free tools. All incoming REST requests, background scheduled tasks, database operations, and external AI calls are tracked through FastAPI middleware and Python logging.

The Telegram Bot API token and destination chat ID are kept strictly secure: they are stored in a local environment configuration file (`.env`) that is never committed to Git (enforced via `.gitignore`). At runtime, credentials are loaded directly into environment variables via Python's `os.getenv()`, preventing credential leaks while enabling automated real-time incident alerts to the private team channel. A sanitized template file (`.env.example`) is maintained in the repository for deployment guidance.

### Alerting Workflow
1. **Event Occurrence:** Something happens in the system (e.g., an endpoint call, database query, AI scheduling invocation, or background worker execution).
2. **Detection & Capture:** The system captures the event via FastAPI middleware, global exception handlers, or periodic health-check routines.
3. **Rule Evaluation:** An alerting rule checks whether a failure threshold or operational condition has been breached (e.g., health probe fails 3 times, AI call error count > 3, latency > 3.5s).
4. **Telegram Dispatch:** The alert dispatcher formats a high-priority Markdown message and dispatches an asynchronous HTTP POST request to the Telegram Bot API (`https://api.telegram.org/bot<TOKEN>/sendMessage`), instantly notifying the engineering team.

### Monitoring Matrix

| What we monitor | When it triggers an alert | Alert message |
| :--- | :--- | :--- |
| **Backend health** | Health check endpoint (`/api/health`) fails or times out 3 times in a row (checked every 60s) | `[CRITICAL] Backend Health Check Failed: Server is unreachable or unresponsive at 2026-10-14 10:15:00 UTC.` |
| **AI scheduling service** | More than 3 AI generation requests fail (HTTP 429/500) or time out (> 10s) within 5 minutes | `[ALERT] AI Service Degradation: 3 OpenAI API calls failed or timed out in the last 5 minutes. Check quota or network latency.` |
| **Database connectivity** | PostgreSQL connection pool exhausted or queries throw connection errors 2 times within 1 minute | `[CRITICAL] Database Connection Error: PostgreSQL connection pool exhausted or database unreachable (2 errors in 1 min).` |
| **Response latency** | Average API response time exceeds 3.5 seconds over a continuous 5-minute rolling window | `[WARNING] High API Latency: Average response time reached 4.2s over the last 5 minutes (threshold: 3.5s).` |
| **Failed logins** | 5 consecutive failed login attempts on a single student account or IP within 3 minutes | `[SECURITY] Brute-Force Alert: 5 failed login attempts detected for account user_id #142 within 3 minutes.` |
| **Unhandled server errors** | 3 unhandled HTTP 500 Internal Server Errors occur across any REST endpoint within 2 minutes | `[ALERT] Unhandled Exceptions: 3 HTTP 500 errors recorded in the last 2 minutes. Inspect backend error logs immediately.` |
