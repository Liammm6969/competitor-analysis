# Competitor Analysis Platform

A comprehensive web application for tracking and analyzing competitor training data. This platform allows users to monitor competitor course offerings, pricing, and enrollment trends, providing valuable insights for strategic decision-making.

## Features

- **Dashboard**: Overview of total competitors, courses, and price trends.
- **Competitor Management**: Add, view, and delete competitors.
- **Training Data Collection**: Track competitor training programs with course details, pricing, and enrollment numbers.
- **AI Analysis**: Automatically analyzes trends and generates insights.

## Tech Stack

### Frontend
- **Framework**: [React](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: Vanilla CSS
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend
- **Framework**: [Express.js](https://expressjs.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [MongoDB](https://www.mongodb.com/)
- **Authentication**: JWT (JSON Web Tokens)
- **APIs**: Competitor Management, Training Data, Analytics

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB

### Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd competitor-analysis
    ```

2.  **Backend Setup**
    ```bash
    cd server
    npm install
    cp .env.example .env
    # Edit .env with your MongoDB connection string
    npm start
    ```

3.  **Frontend Setup**
    ```bash
    cd client
    npm install
    # Edit src/lib/api.ts if your backend URL is different
    npm run dev
    ```

## Usage

Once both the server and client are running:

1.  Open your browser and navigate to `http://localhost:3000`
2.  Use the sidebar to navigate between the **Dashboard**, **Competitors**, **Trainings**, and **Analytics** sections.
3.  Follow the instructions in each section to add data and view insights.

## License

[MIT](LICENSE)