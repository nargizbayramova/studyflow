import asyncio
from datetime import datetime, timezone, timedelta, time
from sqlalchemy import select
from app.core.database import SessionLocal
from app.models.user import User
from app.models.course import Course
from app.models.task import Task, TaskType, TaskStatus, TaskPriority
from app.models.study_block import StudyBlock, BlockStatus
from app.models.availability import AvailabilitySlot, SlotKind

TARGET_EMAIL = "murad.bayramov259@gmail.com"

async def seed_data():
    async with SessionLocal() as db:
        res = await db.execute(select(User).where(User.email == TARGET_EMAIL))
        user = res.scalar_one_or_none()
        if not user:
            print(f"User {TARGET_EMAIL} does not exist in this database. Creating user...")
            from app.core.security import hash_password
            user = User(
                email=TARGET_EMAIL,
                hashed_password=hash_password("12345678"),
                full_name="Murad Bayramov",
                is_active=True,
            )
            db.add(user)
            await db.flush()
            print(f"Created user {user.full_name} (ID: {user.id}) with password 12345678.")

        user_id = user.id
        print(f"Seeding realistic data for user {user.full_name} (ID: {user_id}, {user.email})...")

        # Clean existing data for this user to ensure idempotency
        existing_blocks = (await db.execute(select(StudyBlock).where(StudyBlock.user_id == user_id))).scalars().all()
        for b in existing_blocks:
            await db.delete(b)

        existing_tasks = (await db.execute(select(Task).where(Task.user_id == user_id))).scalars().all()
        for t in existing_tasks:
            await db.delete(t)

        existing_courses = (await db.execute(select(Course).where(Course.user_id == user_id))).scalars().all()
        for c in existing_courses:
            await db.delete(c)

        existing_slots = (await db.execute(select(AvailabilitySlot).where(AvailabilitySlot.user_id == user_id))).scalars().all()
        for s in existing_slots:
            await db.delete(s)

        await db.flush()

        # 1. Create Courses
        courses_data = [
            {
                "code": "CS 189",
                "title": "Introduction to Machine Learning",
                "instructor": "Prof. Sahai",
                "semester": "Fall 2026",
                "color": "#6561BD",
            },
            {
                "code": "EECS 126",
                "title": "Probability & Random Processes",
                "instructor": "Prof. Ramchandran",
                "semester": "Fall 2026",
                "color": "#428A86",
            },
            {
                "code": "DATA 100",
                "title": "Principles of Data Science",
                "instructor": "Prof. Perez",
                "semester": "Fall 2026",
                "color": "#B87584",
            },
            {
                "code": "MATH 54",
                "title": "Linear Algebra & Diff Equations",
                "instructor": "Prof. Nadler",
                "semester": "Fall 2026",
                "color": "#B38A46",
            },
            {
                "code": "PHILOS 25B",
                "title": "Modern Philosophy: Descartes to Kant",
                "instructor": "Prof. Primus",
                "semester": "Fall 2026",
                "color": "#7187B2",
            },
        ]

        course_map = {}
        for cdata in courses_data:
            course = Course(
                user_id=user_id,
                code=cdata["code"],
                title=cdata["title"],
                instructor=cdata["instructor"],
                semester=cdata["semester"],
                color=cdata["color"],
                is_archived=False,
            )
            db.add(course)
            await db.flush()
            course_map[course.code] = course

        print(f"Created {len(course_map)} courses.")

        # Reference anchor: October 15, 2026 14:00:00 UTC
        now_dt = datetime(2026, 10, 15, 14, 0, 0, tzinfo=timezone.utc)

        # 2. Create Tasks
        tasks_data = [
            {
                "course_code": "CS 189",
                "title": "Homework 4: Neural Networks & Backprop",
                "description": "Implement multi-layer perceptron gradient descent and convolutional layers from scratch using NumPy.",
                "type": TaskType.ASSIGNMENT,
                "status": TaskStatus.IN_PROGRESS,
                "priority": TaskPriority.HIGH,
                "due_date": now_dt + timedelta(days=2, hours=9), # Oct 17, 23:00
                "estimated_hours": 4.5,
                "weight_percent": 15.0,
                "ai_priority_score": 9.4,
            },
            {
                "course_code": "EECS 126",
                "title": "Problem Set 6: Markov Chains & Stationary Distributions",
                "description": "Solve convergence theorem proofs and calculate absorbing state probability transition matrices.",
                "type": TaskType.ASSIGNMENT,
                "status": TaskStatus.PENDING,
                "priority": TaskPriority.HIGH,
                "due_date": now_dt + timedelta(days=3, hours=8), # Oct 18, 22:00
                "estimated_hours": 3.5,
                "weight_percent": 10.0,
                "ai_priority_score": 8.8,
            },
            {
                "course_code": "DATA 100",
                "title": "Lab 5: Logistic Regression & Cross-Entropy",
                "description": "Tune regularization hyperparameter lambda on the flight delay prediction dataset.",
                "type": TaskType.ASSIGNMENT,
                "status": TaskStatus.PENDING,
                "priority": TaskPriority.MEDIUM,
                "due_date": now_dt + timedelta(days=4, hours=6), # Oct 19, 20:00
                "estimated_hours": 2.0,
                "weight_percent": 5.0,
                "ai_priority_score": 7.2,
            },
            {
                "course_code": "MATH 54",
                "title": "Midterm 1: Diagonalization & Orthogonal Projections",
                "description": "In-person exam covering vector spaces, Gram-Schmidt process, and symmetric matrix spectral decomposition.",
                "type": TaskType.EXAM,
                "status": TaskStatus.PENDING,
                "priority": TaskPriority.HIGH,
                "due_date": now_dt + timedelta(days=7, hours=5), # Oct 22
                "estimated_hours": 8.0,
                "weight_percent": 25.0,
                "ai_priority_score": 9.8,
            },
            {
                "course_code": "PHILOS 25B",
                "title": "Essay 1 Draft: The Cartesian Cogito & Radical Skepticism",
                "description": "Write a 1,500-word critical evaluation of Descartes' Evil Demon thought experiment and clear-and-distinct perceptions.",
                "type": TaskType.ASSIGNMENT,
                "status": TaskStatus.IN_PROGRESS,
                "priority": TaskPriority.MEDIUM,
                "due_date": now_dt + timedelta(days=9, hours=9), # Oct 24
                "estimated_hours": 4.0,
                "weight_percent": 15.0,
                "ai_priority_score": 7.5,
            },
            {
                "course_code": "CS 189",
                "title": "Project Milestone 2: Baseline Model & Kaggle Submission",
                "description": "Submit baseline ResNet embeddings and report validation loss curves.",
                "type": TaskType.PROJECT_MILESTONE,
                "status": TaskStatus.PENDING,
                "priority": TaskPriority.MEDIUM,
                "due_date": now_dt + timedelta(days=13, hours=9),
                "estimated_hours": 5.0,
                "weight_percent": 20.0,
                "ai_priority_score": 8.1,
            },
            {
                "course_code": "EECS 126",
                "title": "Reading Quiz 7: Entropy and Source Coding",
                "description": "Self-graded comprehension quiz on Huffman codes and Shannon's noiseless coding theorem.",
                "type": TaskType.QUIZ,
                "status": TaskStatus.PENDING,
                "priority": TaskPriority.LOW,
                "due_date": now_dt + timedelta(days=6, hours=4),
                "estimated_hours": 1.0,
                "weight_percent": 5.0,
                "ai_priority_score": 5.2,
            },
            # Completed tasks:
            {
                "course_code": "CS 189",
                "title": "Homework 3: Decision Trees & Random Forests",
                "description": "Implemented information gain splitting heuristics and evaluated bagging variance reduction.",
                "type": TaskType.ASSIGNMENT,
                "status": TaskStatus.COMPLETED,
                "priority": TaskPriority.HIGH,
                "due_date": now_dt - timedelta(days=5),
                "estimated_hours": 4.0,
                "weight_percent": 10.0,
                "ai_priority_score": 8.0,
                "completed_at": now_dt - timedelta(days=5, hours=2),
            },
            {
                "course_code": "EECS 126",
                "title": "Problem Set 5: Poisson Splitting & Merging",
                "description": "Solved arrival times distributions and queued packet servicing problem.",
                "type": TaskType.ASSIGNMENT,
                "status": TaskStatus.COMPLETED,
                "priority": TaskPriority.MEDIUM,
                "due_date": now_dt - timedelta(days=4),
                "estimated_hours": 3.0,
                "weight_percent": 10.0,
                "ai_priority_score": 7.0,
                "completed_at": now_dt - timedelta(days=4, hours=1),
            },
            {
                "course_code": "DATA 100",
                "title": "Lab 4: Exploratory Data Analysis & Transformations",
                "description": "Box-Cox transformations and multivariable outlier detection.",
                "type": TaskType.ASSIGNMENT,
                "status": TaskStatus.COMPLETED,
                "priority": TaskPriority.LOW,
                "due_date": now_dt - timedelta(days=3),
                "estimated_hours": 1.5,
                "weight_percent": 5.0,
                "ai_priority_score": 4.5,
                "completed_at": now_dt - timedelta(days=3, hours=3),
            },
        ]

        task_map = {}
        for tdata in tasks_data:
            course = course_map[tdata["course_code"]]
            task = Task(
                user_id=user_id,
                course_id=course.id,
                title=tdata["title"],
                description=tdata["description"],
                type=tdata["type"],
                status=tdata["status"],
                priority=tdata["priority"],
                due_date=tdata["due_date"],
                estimated_hours=tdata["estimated_hours"],
                weight_percent=tdata["weight_percent"],
                ai_priority_score=tdata.get("ai_priority_score"),
                completed_at=tdata.get("completed_at"),
            )
            db.add(task)
            await db.flush()
            task_map[tdata["title"]] = task

        print(f"Created {len(task_map)} tasks.")

        # 3. Create Study Blocks across the current week (Week of Oct 12 - Oct 18, 2026)
        # Today is Thursday Oct 15, 2026
        # Oct 12: Monday, Oct 13: Tuesday, Oct 14: Wednesday, Oct 15: Thursday, Oct 16: Friday, Oct 17: Saturday, Oct 18: Sunday
        blocks_data = [
            # Past / Completed blocks earlier this week
            {
                "task_title": "Homework 3: Decision Trees & Random Forests",
                "start": datetime(2026, 10, 12, 10, 0, 0, tzinfo=timezone.utc),
                "end": datetime(2026, 10, 12, 12, 0, 0, tzinfo=timezone.utc),
                "status": BlockStatus.COMPLETED,
            },
            {
                "task_title": "Problem Set 5: Poisson Splitting & Merging",
                "start": datetime(2026, 10, 13, 14, 0, 0, tzinfo=timezone.utc),
                "end": datetime(2026, 10, 13, 16, 0, 0, tzinfo=timezone.utc),
                "status": BlockStatus.COMPLETED,
            },
            {
                "task_title": "Lab 4: Exploratory Data Analysis & Transformations",
                "start": datetime(2026, 10, 14, 15, 30, 0, tzinfo=timezone.utc),
                "end": datetime(2026, 10, 14, 17, 0, 0, tzinfo=timezone.utc),
                "status": BlockStatus.COMPLETED,
            },
            # Today's blocks (Thursday, Oct 15)
            {
                "task_title": "Homework 4: Neural Networks & Backprop",
                "start": datetime(2026, 10, 15, 10, 0, 0, tzinfo=timezone.utc),
                "end": datetime(2026, 10, 15, 12, 0, 0, tzinfo=timezone.utc),
                "status": BlockStatus.COMPLETED,
            },
            {
                "task_title": "Homework 4: Neural Networks & Backprop",
                "start": datetime(2026, 10, 15, 16, 0, 0, tzinfo=timezone.utc),
                "end": datetime(2026, 10, 15, 18, 0, 0, tzinfo=timezone.utc),
                "status": BlockStatus.PLANNED,
            },
            # Tomorrow (Friday, Oct 16)
            {
                "task_title": "Problem Set 6: Markov Chains & Stationary Distributions",
                "start": datetime(2026, 10, 16, 9, 30, 0, tzinfo=timezone.utc),
                "end": datetime(2026, 10, 16, 11, 30, 0, tzinfo=timezone.utc),
                "status": BlockStatus.PLANNED,
            },
            {
                "task_title": "Lab 5: Logistic Regression & Cross-Entropy",
                "start": datetime(2026, 10, 16, 14, 0, 0, tzinfo=timezone.utc),
                "end": datetime(2026, 10, 16, 16, 0, 0, tzinfo=timezone.utc),
                "status": BlockStatus.PLANNED,
            },
            # Saturday, Oct 17
            {
                "task_title": "Midterm 1: Diagonalization & Orthogonal Projections",
                "start": datetime(2026, 10, 17, 10, 30, 0, tzinfo=timezone.utc),
                "end": datetime(2026, 10, 17, 13, 0, 0, tzinfo=timezone.utc),
                "status": BlockStatus.PLANNED,
            },
            # Sunday, Oct 18
            {
                "task_title": "Essay 1 Draft: The Cartesian Cogito & Radical Skepticism",
                "start": datetime(2026, 10, 18, 14, 0, 0, tzinfo=timezone.utc),
                "end": datetime(2026, 10, 18, 16, 30, 0, tzinfo=timezone.utc),
                "status": BlockStatus.PLANNED,
            },
        ]

        for bdata in blocks_data:
            task = task_map[bdata["task_title"]]
            block = StudyBlock(
                user_id=user_id,
                task_id=task.id,
                start_at=bdata["start"],
                end_at=bdata["end"],
                status=bdata["status"],
            )
            db.add(block)

        print(f"Created {len(blocks_data)} study blocks.")

        # 4. Weekly Availability Slots
        # 0 = Monday, 1 = Tuesday, 2 = Wednesday, 3 = Thursday, 4 = Friday, 5 = Saturday, 6 = Sunday
        slots_data = [
            # Monday
            {"day": 0, "start": time(9, 0), "end": time(12, 0), "kind": SlotKind.AVAILABLE},
            {"day": 0, "start": time(13, 0), "end": time(15, 0), "kind": SlotKind.BLOCKED},
            {"day": 0, "start": time(15, 30), "end": time(18, 0), "kind": SlotKind.AVAILABLE},
            # Tuesday
            {"day": 1, "start": time(10, 0), "end": time(12, 30), "kind": SlotKind.AVAILABLE},
            {"day": 1, "start": time(14, 0), "end": time(16, 0), "kind": SlotKind.BLOCKED},
            # Wednesday
            {"day": 2, "start": time(9, 0), "end": time(12, 0), "kind": SlotKind.AVAILABLE},
            {"day": 2, "start": time(13, 0), "end": time(15, 0), "kind": SlotKind.BLOCKED},
            {"day": 2, "start": time(16, 0), "end": time(19, 0), "kind": SlotKind.AVAILABLE},
            # Thursday
            {"day": 3, "start": time(10, 0), "end": time(12, 30), "kind": SlotKind.AVAILABLE},
            {"day": 3, "start": time(14, 0), "end": time(16, 0), "kind": SlotKind.BLOCKED},
            {"day": 3, "start": time(16, 30), "end": time(19, 30), "kind": SlotKind.AVAILABLE},
            # Friday
            {"day": 4, "start": time(9, 0), "end": time(12, 0), "kind": SlotKind.AVAILABLE},
            {"day": 4, "start": time(14, 0), "end": time(17, 0), "kind": SlotKind.AVAILABLE},
            # Saturday
            {"day": 5, "start": time(10, 0), "end": time(14, 0), "kind": SlotKind.AVAILABLE},
            # Sunday
            {"day": 6, "start": time(13, 0), "end": time(18, 0), "kind": SlotKind.AVAILABLE},
        ]

        for sdata in slots_data:
            slot = AvailabilitySlot(
                user_id=user_id,
                day_of_week=sdata["day"],
                start_time=sdata["start"],
                end_time=sdata["end"],
                kind=sdata["kind"],
            )
            db.add(slot)

        print(f"Created {len(slots_data)} availability slots.")

        await db.commit()
        print("All realistic data seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
