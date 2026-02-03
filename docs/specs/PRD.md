# PolySci - PRD
Author: Abhishek Konidela
Purpose: App specifications for an app that showcases unbiased, objective discourse on political issues with primary sources listed out

**Working Title**: PolySci


## Goals:
- Increase in awareness of different perspectives on political issues.
- Better understanding of a user's own political views.
- Increase in dependency on primary sources as a basis for political opinions.
- Decrease in fraudulent news sources, political discourses, and facts.


## Non-Goals:
- This will not be an app that sways a user towards a certain political opinion
- This will not be a resource that debates users on political opinions


## User Personas:

We will be supporting politically non active, passively active, and semi-active users.

- Non politically active users:
	- Users that don't read the news.
	- They get their information from friends, occasional tiktok videos, and other social media channels.
	- They don't take part in elections.
- Passively politically active users:
	- Users that read the news only when it's really big news.
	- They have an idea of what's going on in the world but don't dive into the details.
	- They don't know the history behind events, and take most news from a surface level analysis.
	- They might occasionally read 2-3 news articles a week.
	- They don't take part in local elections.
	- They do take part in federal elections.
- Semi-active users:
	- Users that read the news frequently. 5 times a week.
	- Have a great understanding of world events and how they're connected.
	- They tend to research some topics out of curiosity but only if they are impacted by it.
	- They take part in elections, both local and federal.
	- Have an understanding of both parties in the USA, but aren't knowledgeable on politics of other countries.


## Tech Stack (MVP)

- **Frontend**: Next.js (React)
- **Backend**: Node.js (Next.js API routes)
- **Database**: Firebase Firestore (news cache, future auth/history)
- **LLM**: GPT-4o via OpenAI API
- **Deployment**: Local only for MVP (Vercel later)


## Data Sources

### News Content
- **Newsdata.io API**: Primary news article source
  - Responses cached in Firebase to manage rate limits and provide test data
  - Free tier: 200 credits/day (~2000 articles/day)

### Fact-Checking
- Politifact
- FactCheck.org
- Snopes

### Quantitative Data (Government APIs)
- **Bureau of Labor Statistics (BLS)**: Jobs, wages, unemployment, inflation
- **USASpending.gov**: Federal budget, government spending
- **Census Bureau**: Demographics, population, income distribution
- **Congress.gov API**: Legislation, voting records, congressional activity


## Critical User Journeys

### North Star Journey (MVP):

1. User lands on the homepage and sees 5 featured stories from the past week
2. User either clicks a featured story OR types a brief summary of a news event they want to understand
3. The app gathers context from multiple sources (news, fact-checks, government data)
4. The app outputs the following information with inline citations and a consolidated source list:
	- Quick summary of the event (2-3 sentences)
	- Why is it significant right now (2 sentences)
	- Top 5 relevant parties involved (people, groups, entities - not political parties)
	- How do the Democrats feel about this?
	- How do the Republicans feel about this?
	- Why does this matter to the common joe?
	- Quantitative data and statistics on related topics
	- If no relevant information exists for a section: "Nothing to see here folks."
5. User sees clickable follow-up options for common questions PLUS a text input for custom questions
6. Response streams in real-time (like ChatGPT)
7. Conversation continues until the user is satisfied

### Theme
- "Discourse to become more aware of the world" - educational, enlightening
- NOT "arguments about politics" - avoid combative framing


## UI/UX Decisions

- **Layout**: Single-page chat interface with featured stories at top
- **Input**: Text only (user types or pastes description of news event)
- **Response display**: Streaming (real-time, like ChatGPT)
- **Source citations**: Hybrid - inline citations for specific claims, consolidated list at end
- **Follow-up interaction**: Clickable options for common follow-ups + freeform text input
- **AI Disclaimer**: Include disclaimer that analysis is AI-generated, encourage verification with primary sources


## Future Enhancements
Ignore this list completely. It's purely for tracking purposes. Do not implement these until asked to do so.

- User authentication (save history, preferences)
- URL parsing (paste article link instead of typing summary)
- Personalized "why you should care" based on user info (location, situation)
- Users can select on any of the outputs to further deep dives into them
- After the conversation, showcase relevant news events in the past 2 months that they might be interested in depending on the conversation
- Expand to broader political discourse on common topics
