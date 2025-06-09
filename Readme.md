InkWell

[![Docker Compose](https://img.shields.io/badge/Docker-Compose-blue.svg)](https://docs.docker.com/compose/)
[![Frontend: React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Backend: Node.js/Express](https://img.shields.io/badge/Backend-Node.js/Express-339933?logo=nodedotjs&logoColor=white)](https://expressjs.com/)
[![Database: PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

---

## 🚀 Overview

This is a full-stack, 3-tier web application designed as a modern blog platform, inspired by popular content-sharing sites like Medium. It provides a robust architecture for creating, publishing, and interacting with blog posts.

This project was built to demonstrate proficiency in containerized development, multi-service orchestration with Docker Compose, and a solid understanding of frontend, backend, and database integration.

## ✨ Features

* **User Authentication:** Secure user registration and login.
* **Post Management:** Create, read, update, and delete (CRUD) blog posts.
* **Dynamic Content:** Display rich text content for blog articles.
* **Containerized Development:** All services run within Docker containers for consistent environments.
* **3-Tier Architecture:** Clear separation of concerns between frontend, backend API, and database.

## 🛠️ Technologies Used

### Frontend
* **React:** A JavaScript library for building user interfaces.
* **Vite:** A fast build tool for modern web projects.
* **CSS/HTML:** Standard web technologies.

### Backend
* **Node.js:** A JavaScript runtime for server-side development.
* **Express.js:** A fast, unopinionated, minimalist web framework for Node.js.
* **JWT (JSON Web Tokens):** For secure authentication.

### Database
* **PostgreSQL:** A powerful, open-source relational database system.

### Infrastructure
* **Docker:** For containerizing individual services.
* **Docker Compose:** For defining and running multi-container Docker applications.

## 🚀 Getting Started

Follow these steps to get the application up and running on your local machine.

### Prerequisites

Before you begin, ensure you have the following installed:

* **Git:** For cloning the repository.
* **Docker Desktop:** Includes Docker Engine and Docker Compose.
    * [Download Docker Desktop](https://www.docker.com/products/docker-desktop)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-github-username/your-project-name.git](https://github.com/your-github-username/your-project-name.git)
    cd your-project-name
    ```
    *(Replace `your-github-username` and `your-project-name` with your actual GitHub details.)*

2.  **Set up Environment Variables:**
    Create `.env` files in the **root directory** of your project and in the `backend` directory.

    * **Root `.env` (`./.env`):**
        This file is used by `docker-compose.yml` to configure the database service.
        ```dotenv
        # Database Configuration for Docker Compose
        POSTGRES_DB=db3t               # Your chosen database name
        POSTGRES_USER=db3t_user        # Your chosen database user
        POSTGRES_PASSWORD=mysecretpassword # Your chosen database password
        ```
        *(Note: Remember to replace `mysecretpassword` with your actual strong password)*

    * **Backend `.env` (`./backend/.env`):**
        This file is used by your Node.js backend application to connect to the database and for JWT.
        ```dotenv
        # Backend Application Configuration
        PORT=3001

        # PostgreSQL Database Configuration (must match root .env)
        DB_HOST=db                 # This is the service name defined in docker-compose.yml
        DB_USER=db3t_user
        DB_PASSWORD=mysecretpassword
        DB_NAME=db3t
        DB_PORT=5432

        # JSON Web Token Secret (Generate a strong, random string here!)
        JWT_SECRET=a_strong_random_secret_for_jwt_development_only
        ```
        *(Note: Remember to replace `mysecretpassword` and `a_strong_random_secret_for_jwt_development_only` with your actual strong values.)*

3.  **Run the Application with Docker Compose:**
    From the **root directory** of your project (where `docker-compose.yml` is located), run:
    ```bash
    docker compose up --build
    ```
    This command will:
    * Build the Docker images for your backend and frontend (using their `Dockerfile.dev`).
    * Create and start the `postgres_db`, `my_backend_app`, and `my_frontend_app` containers.
    * Initialize the PostgreSQL database (if it's the first run or volume data was cleared).
    * Map the necessary ports.

    *(**Troubleshooting Hot Reloading:** If frontend/backend hot reloading isn't working, ensure `frontend/vite.config.js` has `server.watch.usePolling: true` and `backend/package.json`'s `dev` script uses `nodemon` with appropriate watch settings for bind mounts.)*

### Accessing the Application

Once `docker compose up` finishes and all services are running:

* **Frontend (Your Web App):**
    Open your web browser and navigate to:
    **`http://localhost:3000`**

* **Backend API:**
    Your backend API will be accessible on your host machine at:
    **`http://localhost:3001`**
    (You can test API endpoints using tools like Postman or Insomnia.)

* **PostgreSQL Database (Optional Direct Access):**
    If you wish to connect directly to the database from a local tool (e.g., DBeaver, pgAdmin):
    * **Host:** `localhost`
    * **Port:** `5432`
    * **User:** `db3t_user`
    * **Password:** `mysecretpassword` (from your `.env`)
    * **Database:** `db3t`

## 📂 Project Structure

.
├── backend/                  # Node.js/Express backend API
│   ├── src/                  # Backend source code
│   ├── package.json          # Node.js dependencies and scripts
│   ├── Dockerfile.dev        # Dockerfile for backend development
│   └── .env                  # Backend environment variables
├── frontend/                 # React/Vite frontend application
│   ├── src/                  # Frontend source code
│   ├── public/               # Static assets
│   ├── package.json          # Node.js dependencies and scripts
│   ├── vite.config.js        # Vite configuration (for hot-reloading)
│   └── Dockerfile.dev        # Dockerfile for frontend development
├── db-init-scripts/          # SQL scripts for initial database setup
│   ├── 01-schema.sql         # Example: database schema creation
│   └── 02-seed-data.sql      # Example: initial data population
├── docker-compose.yml        # Defines and links all services
├── .env                      # Root environment variables for Docker Compose
├── .gitignore                # Specifies intentionally untracked files to ignore
└── README.md                 # This file!


## 💡 Future Enhancements

* Add robust error handling and logging.
* Implement pagination for blog posts.
* Introduce user profile management.
* Integrate image uploads for posts.
* Set up CI/CD pipeline for automated testing and deployment.
* ... (Add any other features you plan or wish to add)

## 🤝 Contributing

Feel free to fork this repository, submit issues, or propose pull requests.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 📞 Contact

Gabriel - gabengi@github.com

---