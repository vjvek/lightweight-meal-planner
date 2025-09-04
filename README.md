# 🍽️ Meal Planner Web App

A lightweight web application for planning meals, creating recipes and generating shopping lists. Built with PHP and requiring only a standard web server (e.g. Nginx, Apache). Designed for self hosting on you local network to help take the chore out of planning your meals!

## ✨ Features

📖 Recipe Management 
- Add, edit, and delete recipes
- Store ingredients and cooking instructions
- Dynamically calculates ingredient quantities based on serving sizes

🛒 Shopping List Generator

- Automatically generate a shopping list, including quantities, from selected recipes

📅 Weekly Meal Planner

- Plan all your meals in 1 place

## 🛠️ Requirements

- PHP 8.0+
- A web server such as Nginx or Apache
- No database needed!

## ➡ Getting Started

### Clone the repository

1. Clone the repo
2. Set up your web server
3. Point your web server’s document root to the `public/` directory.
4. Ensure the `backend/` directory is accessible via PHP. You'll need to create an alias for it as `/api/`.