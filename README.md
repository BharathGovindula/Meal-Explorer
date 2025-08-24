# Meal Explorer

A responsive web application that fetches food and recipe data from the MealDB API. This application allows users to search, filter, and sort meals from TheMealDB database.

## Features

- **Responsive Design**: Works smoothly on desktop, tablet, and mobile devices
- **Search Functionality**: 
  - Debounced search to avoid unnecessary API calls
  - Suggestion dropdown while typing
  - Click on suggestions to view specific meals
- **Filtering & Sorting**: 
  - Filter meals by category
  - Sort meals by name or category
  - Combined filtering and sorting functionality
- **Pagination**: 
  - Navigate through meal results with throttled pagination controls
  - Visual page number indicators
- **Loading Animation**: 
  - Displays a loader while fetching data from the API

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- TheMealDB API

## How to Use

1. Open `index.html` in a web browser
2. Use the search bar to find specific meals
3. Filter meals by category using the dropdown
4. Sort meals by name or category
5. Navigate through pages using the pagination controls

## API Reference

This project uses [TheMealDB API](https://www.themealdb.com/api.php) to fetch meal data.