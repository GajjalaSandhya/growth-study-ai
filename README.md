# StudyMate AI Dashboard

Build a modern, polished, responsive frontend for an AI-native learning platform called "StudyMate AI".

IMPORTANT:

This is NOT just an AI chatbot. It is an AI Study Companion that helps students understand learning materials, practice through adaptive quizzes, measure concept mastery, analyze growth, and recommend what to learn next.

The frontend should be designed as a professional SaaS product suitable for a technical project submission/demo.

TECH STACK:

- React

- TypeScript

- Tailwind CSS

- Modern component architecture

- Responsive design for desktop, tablet, and mobile

- Use reusable components

- Use realistic mock data for now

- Keep API integration easy to add later

- Do NOT implement backend logic in the frontend

- Create clean API/service abstraction points for future Node.js + Express backend integration

BRAND:

Product name: StudyMate AI

Tagline: "Learn smarter. Practice better. Grow continuously."

DESIGN STYLE:

- Modern AI SaaS dashboard

- Clean, minimal, premium UI

- Professional but student-friendly

- Avoid excessive gradients

- Avoid overly flashy AI effects

- Strong visual hierarchy

- Spacious layouts

- Rounded cards

- Subtle shadows

- Smooth hover transitions

- Excellent typography

- Accessible contrast

- Consistent spacing

- Use icons where appropriate

- Use charts for analytics

- Make the product feel like a serious EdTech/AI product

COLOR DIRECTION:

Use a sophisticated blue/indigo based primary color system with neutral backgrounds.

Use green for success/mastery.

Use amber/orange for warnings or areas needing improvement.

Use red only for errors.

Keep the overall interface clean and not overly colorful.

==================================================

1. AUTHENTICATION

==================================================

Create:

- Login page

- Signup page

- Forgot password page

Login:

- Email

- Password

- Remember me

- Login button

- Google login placeholder

- Link to Signup

- Clean illustration/visual on the side

Signup:

- Full name

- Email

- Password

- Confirm password

- Create account

Use frontend validation and clear error states.

==================================================

2. MAIN APPLICATION LAYOUT

==================================================

After login, use a dashboard layout:

LEFT SIDEBAR:

Logo:

StudyMate AI

Navigation:

Overview

Spaces

Projects

Tutor

Quizzes

Growth

Analytics

Divider

Activity

Recommendations

Divider

Settings

For admin users show:

Admin Dashboard

BOTTOM OF SIDEBAR:

- User avatar

- User name

- Email

- Settings

- Logout

TOP BAR:

- Search

- Notification icon

- Current space/project breadcrumb where appropriate

- User profile menu

Sidebar should collapse on smaller screens.

==================================================

3. OVERVIEW / HOME DASHBOARD

==================================================

Create an attractive student dashboard.

Header:

"Good morning, Yuvtej 👋"

"Let's continue learning."

Show:

Learning streak

Total study time

Concepts mastered

Quiz accuracy

Example cards:

7 Day Streak

12.5 hrs

24 Concepts Mastered

82% Quiz Accuracy

Then:

"Continue Learning"

Show project cards with:

- Project name

- Subject/topic

- Progress percentage

- Concepts mastered

- Last activity

- Continue button

Example:

Java DSA

Progress: 68%

12/18 concepts mastered

Last studied: Today

[Continue Learning]

Machine Learning

Progress: 42%

Then:

"Recommended Next"

Example recommendation:

"Review Monotonic Stack"

Reason:

"Your recent quiz performance shows this concept needs reinforcement."

Button:

"Start Review"

Then:

"Recent Activity"

Timeline:

- Completed Adaptive Quiz

- Asked Tutor a question

- Uploaded PDF

- Mastery increased

- Completed assessment

==================================================

4. SPACES PAGE

==================================================

Spaces organize learning.

Page title:

"My Spaces"

Button:

"+ Create Space"

Display cards:

Example:

Computer Science

8 Projects

72% Average Progress

Machine Learning

4 Projects

58% Average Progress

Each card:

- Space icon

- Name

- Description

- Number of projects

- Progress

- Last activity

- Open Space button

Create Space modal:

- Space name

- Description

- Optional icon

- Create button

==================================================

5. SPACE DETAIL PAGE

==================================================

Show:

Breadcrumb:

Spaces / Computer Science

Header:

Computer Science

Description

Statistics:

Projects

Materials

Study Time

Average Mastery

Projects grid.

Button:

"+ Create Project"

==================================================

6. PROJECTS PAGE

==================================================

Page title:

"My Projects"

Filters:

- All

- In Progress

- Completed

- Needs Review

Project card should contain:

Project title

Description

Material count

Concept count

Progress bar

Mastery score

Last activity

Buttons:

Open Project

Ask Tutor

==================================================

7. PROJECT DETAIL PAGE

==================================================

This is one of the most important screens.

Layout:

Header:

Project name

Project description

Actions:

+ Upload Material

Ask Tutor

Take Quiz

Statistics:

Progress

Mastery

Study Time

Quiz Accuracy

Tabs:

Overview

Materials

Tutor

Quiz

Mastery

Growth

Analytics

Activity

Overview should show:

Learning progress

Concept mastery overview

Recent activity

Recommended next action

==================================================

8. MATERIALS PAGE

==================================================

Create a professional document management UI.

Title:

"Learning Materials"

Button:

"+ Upload PDF"

Upload area:

Drag and drop PDF here

"Upload your learning material"

Supported format:

PDF

Show uploaded documents as cards/table:

Document name

File size

Pages

Processing status

Uploaded date

Processing states:

Uploading

Processing

Ready

Failed

For processing:

Show progress indicator.

For failed:

Show error message + Retry button.

For ready:

Actions:

Open

Ask Tutor

Delete

IMPORTANT:

The UI should clearly communicate document processing status.

==================================================

9. AI TUTOR

==================================================

Create the main AI Tutor experience.

Layout:

LEFT:

Project context/document list.

CENTER:

Chat interface.

RIGHT:

"Sources" panel.

Header:

AI Tutor

"Ask questions about your learning materials."

Chat messages should look polished.

User message example:

"Explain monotonic stack with an example."

AI response:

"Based on your uploaded material, a monotonic stack is..."

Include:

Source citation cards:

Source

Java-DSA.pdf

Page 24

Clickable citation.

Show "View source" button.

Input:

"Ask anything about this project..."

Buttons:

Send

Attach

Quick prompts:

Explain this concept

Give me an example

Summarize this section

Test my understanding

==================================================

10. GROUNDED RESPONSE UI

==================================================

AI answers should visually distinguish:

Answer

Sources

Confidence/grounding indicator

Example:

✓ Answer grounded in your materials

Sources:

Java DSA Notes — Page 24

Java DSA Notes — Page 27

Make citations clickable.

==================================================

11. UNSUPPORTED QUESTION STATE

==================================================

If user asks something outside uploaded materials, show a professional refusal state.

Example:

"I couldn't find enough information about this topic in your uploaded materials."

Then:

"Try asking about:

- Monotonic Stack

- Sliding Window

- Binary Trees"

Button:

"Ask about this project"

Do NOT make the AI appear to hallucinate.

==================================================

12. ADAPTIVE QUIZ

==================================================

Create Quiz landing page.

Header:

"Adaptive Quiz"

Description:

"Questions are selected based on your current understanding."

Show:

Select concepts

Difficulty

Number of questions

Example:

Concepts:

✓ Arrays

✓ Stack

✓ Sliding Window

○ Trees

Difficulty:

Adaptive

Questions:

10

Button:

"Start Quiz"

==================================================

13. QUIZ INTERFACE

==================================================

Create a focused quiz experience.

Top:

Question 4 of 10

Progress bar

Question:

"What is the primary advantage of a monotonic stack?"

Multiple choice options.

Buttons:

Previous

Next

Show:

Current question number

Answered count

Remaining count

Don't reveal answers until submission.

==================================================

14. QUIZ RESULT PAGE

==================================================

After quiz:

"Quiz Complete 🎉"

Show:

Score: 82%

Correct: 8

Incorrect: 2

Concept performance:

Arrays — 92%

Stacks — 76%

Sliding Window — 61%

Show:

"Needs Review"

Sliding Window

Reason:

"You answered 2 of 4 questions incorrectly."

Button:

"Review Concept"

Also show:

"Recommended Next Action"

==================================================

15. OPEN-ENDED ASSESSMENT

==================================================

Create an open-ended assessment screen.

Question:

"Explain how a monotonic stack works and provide an example."

Large text area.

Button:

"Submit Answer"

After submission show:

AI Evaluation

Understanding: 82%

Accuracy

Completeness

Conceptual clarity

Feedback:

"Your explanation correctly identifies..."

Areas to improve:

"Explain why elements are removed from the stack."

Button:

"Practice Again"

==================================================

16. CONCEPT MASTERY

==================================================

Create a Mastery page.

Title:

"Concept Mastery"

Show concept cards:

Arrays

92% Mastered

Stacks

78% Mastered

Sliding Window

61% Mastered

Trees

45% Mastered

Use progress indicators.

Status labels:

Mastered

Strong

Developing

Needs Review

Clicking a concept opens:

Concept overview

Mastery score

Quiz history

Assessment history

Tutor interactions

Recommended practice

==================================================

17. GROWTH ANALYSIS

==================================================

Create a visually strong Growth page.

Header:

"Your Learning Growth"

Show line chart:

Mastery over time

Example:

Week 1 → 42%

Week 2 → 51%

Week 3 → 63%

Week 4 → 74%

Show:

Concepts improved

Quiz accuracy improvement

Study consistency

Strongest concepts

Weakest concepts

Section:

"Your Progress"

Example:

+18% mastery this month

"You're improving fastest in Data Structures."

==================================================

18. ANALYTICS

==================================================

Create analytics dashboard.

Metrics:

Total Study Time

Quiz Accuracy

Concept Mastery

Questions Answered

Tutor Questions

Learning Streak

Charts:

Mastery trend

Quiz performance

Study activity

Concept distribution

Allow filters:

7 days

30 days

90 days

Project-level analytics should be available inside projects.

Global analytics should be available from the main Analytics page.

==================================================

19. RECOMMENDATIONS

==================================================

Create:

"Recommended for You"

Recommendation cards:

Review Sliding Window

Reason:

"Your recent assessment indicates this concept needs reinforcement."

Practice Stack Problems

Reason:

"Your mastery is improving. Practice will help reach mastery."

Take Adaptive Quiz

Reason:

"You haven't tested your understanding recently."

Each recommendation has:

- Reason

- Priority

- Estimated time

- Start button

==================================================

20. ACTIVITY PAGE

==================================================

Show chronological learning activity.

Examples:

Today

Completed Adaptive Quiz

Score: 82%

Today

Asked Tutor about Monotonic Stack

Yesterday

Uploaded Java DSA PDF

Yesterday

Mastery increased: Stack +8%

Use a clean timeline design.

==================================================

21. ADMIN DASHBOARD

==================================================

Create a separate professional admin interface.

Sidebar:

Dashboard

Users

Spaces

Projects

Activity

Learning Progress

AI Usage

AI Evaluation

System Health

Dashboard cards:

Total Users

Active Users

Total Projects

Total Materials

AI Requests

Average Quiz Score

Charts:

User activity

Project activity

AI usage

Learning progress

==================================================

22. ADMIN USERS

==================================================

Table:

User

Email

Spaces

Projects

Last Active

Progress

Status

Actions:

View User

==================================================

23. ADMIN AI USAGE

==================================================

Show:

Total AI requests

Tutor requests

Quiz generations

Assessments

Recommendations

Metrics:

Requests today

Requests this week

Token usage

Average response time

Failure rate

==================================================

24. ADMIN AI EVALUATION

==================================================

Create dashboard showing:

Grounded response rate

Unsupported question handling

Average evaluation score

Failed AI requests

Cards:

Grounding: 94%

Answer quality: 89%

Unsupported handling: 97%

Show recent evaluations.

==================================================

25. SYSTEM HEALTH

==================================================

Show:

API Status

Database Status

AI Provider Status

Document Processing Status

Background Jobs

Use status indicators:

Healthy

Warning

Error

Show recent system events.

==================================================

26. SETTINGS

==================================================

Create settings page with:

Profile

Account

Notifications

Appearance

Security

Profile:

Name

Email

Avatar

==================================================

27. EMPTY STATES

==================================================

Create beautiful empty states.

No spaces:

"Create your first learning space."

No projects:

"Create a project to start learning."

No materials:

"Upload a PDF to give your AI Tutor learning context."

No quiz history:

"Take your first adaptive quiz."

==================================================

28. LOADING STATES

==================================================

Use skeleton loaders for:

Dashboard

Projects

Materials

Tutor

Analytics

For AI responses show:

"Thinking..."

"Searching your materials..."

"Generating grounded response..."

==================================================

29. ERROR STATES

==================================================

Create professional error handling.

Examples:

PDF upload failed

Document processing failed

AI request failed

Network error

Unauthorized

Not found

Always provide a useful recovery action:

Retry

Go Back

Return to Dashboard

==================================================

30. RESPONSIVE DESIGN

==================================================

Desktop:

Full sidebar + dashboard.

Tablet:

Collapsible sidebar.

Mobile:

Bottom navigation or collapsible navigation.

Chat interface should work properly on mobile.

Charts must resize correctly.

Tables should become horizontally scrollable or responsive cards.

==================================================

31. COMPONENT ARCHITECTURE

==================================================

Create reusable components:

Sidebar

TopNavbar

StatCard

ProjectCard

SpaceCard

MaterialCard

ProgressBar

MasteryCard

RecommendationCard

ActivityTimeline

ChatMessage

SourceCitation

QuizQuestion

QuizOption

AnalyticsChart

EmptyState

LoadingState

ErrorState

Modal

Toast

Badge

Button

==================================================

32. FRONTEND ROUTES

==================================================

Create routes for:

/login

/signup

/dashboard

/spaces

/spaces/:spaceId

/projects

/projects/:projectId

/projects/:projectId/materials

/projects/:projectId/tutor

/projects/:projectId/quiz

/projects/:projectId/mastery

/projects/:projectId/growth

/projects/:projectId/analytics

/activity

/recommendations

/analytics

/settings

Admin:

/admin

/admin/users

/admin/spaces

/admin/projects

/admin/activity

/admin/analytics

/admin/ai-usage

/admin/ai-evaluation

/admin/system-health

==================================================

33. IMPORTANT PRODUCT FLOW

==================================================

The UI must support this connected learning journey:

Create Space

↓

Create Project

↓

Upload Material

↓

Material Processing

↓

Learn with AI Tutor

↓

Receive Grounded Answer

↓

View Source Citation

↓

Ask Unsupported Question

↓

Receive Appropriate Refusal

↓

Take Adaptive Quiz

↓

See Performance

↓

Mastery Updates

↓

View Growth

↓

View Analytics

↓

Receive Recommended Next Action

↓

Continue Learning

Do not design these as disconnected pages.

The user should always understand:

- What they are learning

- Which project they are in

- What materials are being used

- How well they understand the concepts

- What they should do next

==================================================

34. DEMO DATA

==================================================

Use realistic demo data so the UI looks complete.

Example project:

Java Data Structures & Algorithms

Materials:

- Java DSA Notes.pdf

- Stack Problems.pdf

- Sliding Window.pdf

Concepts:

- Arrays

- HashMap

- Stack

- Queue

- Sliding Window

- Two Pointers

- Binary Trees

Example mastery:

Arrays 92%

HashMap 88%

Stack 78%

Queue 72%

Sliding Window 61%

Binary Trees 45%

Use realistic activity and analytics data.

==================================================

35. FINAL QUALITY REQUIREMENTS

==================================================

Make the UI feel production-ready.

Avoid:

- Generic template appearance

- Excessive animations

- Huge empty spaces

- Random gradients

- Fake AI gimmicks

- Unnecessary features

Prioritize:

- Excellent UX

- Clear information hierarchy

- Consistency

- Professional dashboard design

- Learning-focused interactions

- Grounded AI experience

- Analytics

- Mastery visualization

- Recommendations

- Responsive design

The final result should look like a real AI learning product that could be demonstrated to recruiters.

IMPORTANT:

Keep the frontend modular so that I can later connect it to a Node.js + Express + MongoDB backend through REST APIs.

For now, implement the frontend with realistic mock data and clearly separated service/API layers so backend integration can be added without rewriting the UI.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://growth-study-ai.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b26e3190-760a-47f2-bab4-35feace7a8f1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
