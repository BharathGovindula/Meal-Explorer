// Global variables
const API_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';
let allMeals = [];
let filteredMeals = [];
let currentPage = 1;
const mealsPerPage = 9;
let categories = [];
let debounceTimer;
let throttleTimer;

// DOM Elements
const searchInput = document.getElementById('search-input');
const suggestionsDropdown = document.getElementById('suggestions');
const categoryFilter = document.getElementById('category-filter');
const sortBy = document.getElementById('sort-by');
const mealsContainer = document.getElementById('meals-container');
const loader = document.getElementById('loader');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageNumbers = document.getElementById('page-numbers');

// Initialize the application
async function initApp() {
    showLoader();
    
    // Fetch all categories
    await fetchCategories();
    
    // Fetch initial meals (using a popular category to start)
    await fetchMealsByCategory('Chicken');
    
    // Hide loader after initial data is loaded
    hideLoader();   
    
    // Set up event listeners
    setupEventListeners();
}

// Fetch all meal categories
async function fetchCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories.php`);
        const data = await response.json();
        
        if (data.categories) {
            categories = data.categories;
            populateCategoryFilter(categories);
        }
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

// Populate category filter dropdown
function populateCategoryFilter(categories) {
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.strCategory;
        option.textContent = category.strCategory;
        categoryFilter.appendChild(option);
    });
}

// Fetch meals by category
async function fetchMealsByCategory(category) {
    try {
        const response = await fetch(`${API_BASE_URL}/filter.php?c=${category}`);
        const data = await response.json();
        
        if (data.meals) {
            // Fetch complete meal details for each meal
            const detailedMeals = await Promise.all(
                data.meals.map(meal => fetchMealDetails(meal.idMeal))
            );
            
            allMeals = detailedMeals.filter(meal => meal !== null);
            filteredMeals = [...allMeals];
            
            sortMeals();
            renderMeals();
        }
    } catch (error) {
        console.error('Error fetching meals by category:', error);
    }
}

// Fetch meal details by ID
async function fetchMealDetails(mealId) {
    try {
        const response = await fetch(`${API_BASE_URL}/lookup.php?i=${mealId}`);
        const data = await response.json();
        
        if (data.meals && data.meals.length > 0) {
            return data.meals[0];
        }
        return null;
    } catch (error) {
        console.error('Error fetching meal details:', error);
        return null;
    }
}

// Search meals by name
async function searchMealsByName(searchTerm) {
    if (!searchTerm.trim()) {
        suggestionsDropdown.style.display = 'none';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/search.php?s=${searchTerm}`);
        const data = await response.json();
        
        if (data.meals) {
            displaySuggestions(data.meals);
        } else {
            suggestionsDropdown.innerHTML = '<div class="suggestion-item">No meals found</div>';
            suggestionsDropdown.style.display = 'block';
        }
    } catch (error) {
        console.error('Error searching meals:', error);
    }
}

// Display search suggestions
function displaySuggestions(meals) {
    suggestionsDropdown.innerHTML = '';
    
    meals.slice(0, 5).forEach(meal => {
        const suggestionItem = document.createElement('div');
        suggestionItem.classList.add('suggestion-item');
        suggestionItem.textContent = meal.strMeal;
        
        suggestionItem.addEventListener('click', () => {
            searchInput.value = meal.strMeal;
            suggestionsDropdown.style.display = 'none';
            
            // Set filtered meals to just this meal
            filteredMeals = [meal];
            currentPage = 1;
            renderMeals();
        });
        
        suggestionsDropdown.appendChild(suggestionItem);
    });
    
    suggestionsDropdown.style.display = 'block';
}

// Filter meals based on search and category
function filterMeals() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = categoryFilter.value;
    
    filteredMeals = allMeals.filter(meal => {
        const matchesSearch = !searchTerm || meal.strMeal.toLowerCase().includes(searchTerm);
        const matchesCategory = !selectedCategory || meal.strCategory === selectedCategory;
        
        return matchesSearch && matchesCategory;
    });
    
    sortMeals();
    currentPage = 1;
    renderMeals();
}

// Sort meals based on selected option
function sortMeals() {
    const sortOption = sortBy.value;
    
    filteredMeals.sort((a, b) => {
        if (sortOption === 'name') {
            return a.strMeal.localeCompare(b.strMeal);
        } else if (sortOption === 'category') {
            return a.strCategory.localeCompare(b.strCategory);
        }
        return 0;
    });
}

// Render meals to the page
function renderMeals() {
    mealsContainer.innerHTML = '';
    
    const startIndex = (currentPage - 1) * mealsPerPage;
    const endIndex = startIndex + mealsPerPage;
    const mealsToDisplay = filteredMeals.slice(startIndex, endIndex);
    
    if (mealsToDisplay.length === 0) {
        mealsContainer.innerHTML = '<div class="no-results">No meals found. Try a different search or filter.</div>';
    } else {
        mealsToDisplay.forEach(meal => {
            const mealCard = createMealCard(meal);
            mealsContainer.appendChild(mealCard);
        });
    }
    
    updatePagination();
}

// Create a meal card element
function createMealCard(meal) {
    const mealCard = document.createElement('div');
    mealCard.classList.add('meal-card');
    
    mealCard.innerHTML = `
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="meal-image">
        <div class="meal-info">
            <h3 class="meal-name">${meal.strMeal}</h3>
            <span class="meal-category">${meal.strCategory}</span>
        </div>
    `;
    
    return mealCard;
}

// Update pagination controls
function updatePagination() {
    const totalPages = Math.ceil(filteredMeals.length / mealsPerPage);
    
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
    
    pageNumbers.innerHTML = '';
    
    // Show limited page numbers with ellipsis for better UX
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // Add first page if not included
    if (startPage > 1) {
        addPageNumber(1);
        if (startPage > 2) {
            addEllipsis();
        }
    }
    
    // Add visible page numbers
    for (let i = startPage; i <= endPage; i++) {
        addPageNumber(i);
    }
    
    // Add last page if not included
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            addEllipsis();
        }
        addPageNumber(totalPages);
    }
}

// Add a page number button
function addPageNumber(pageNum) {
    const pageButton = document.createElement('div');
    pageButton.classList.add('page-number');
    if (pageNum === currentPage) {
        pageButton.classList.add('active');
    }
    pageButton.textContent = pageNum;
    
    pageButton.addEventListener('click', () => {
        if (pageNum !== currentPage) {
            currentPage = pageNum;
            renderMeals();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    
    pageNumbers.appendChild(pageButton);
}

// Add ellipsis for pagination
function addEllipsis() {
    const ellipsis = document.createElement('div');
    ellipsis.classList.add('page-number');
    ellipsis.textContent = '...';
    ellipsis.style.cursor = 'default';
    pageNumbers.appendChild(ellipsis);
}

// Show loader
function showLoader() {
    loader.style.display = 'flex';
    mealsContainer.style.display = 'none';
}

// Hide loader
function hideLoader() {
    loader.style.display = 'none';
    mealsContainer.style.display = 'grid';
}

// Set up event listeners
function setupEventListeners() {
    // Search input with debouncing
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        
        const searchTerm = searchInput.value.trim();
        
        // Show suggestions as user types
        if (searchTerm.length > 1) {
            debounceTimer = setTimeout(() => {
                searchMealsByName(searchTerm);
            }, 500);
        } else {
            suggestionsDropdown.style.display = 'none';
        }
        
        // Filter meals based on search
        debounceTimer = setTimeout(() => {
            filterMeals();
        }, 500);
    });
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestionsDropdown.contains(e.target)) {
            suggestionsDropdown.style.display = 'none';
        }
    });
    
    // Category filter change
    categoryFilter.addEventListener('change', async (e) => {
        const selectedCategory = e.target.value;
        
        if (selectedCategory) {
            showLoader();
            await fetchMealsByCategory(selectedCategory);
            hideLoader();
        } else {
            filterMeals();
        }
    });
    
    // Sort option change
    sortBy.addEventListener('change', () => {
        sortMeals();
        renderMeals();
    });
    
    // Pagination buttons with throttling
    prevPageBtn.addEventListener('click', () => {
        if (throttleTimer) return;
        
        throttleTimer = setTimeout(() => {
            if (currentPage > 1) {
                currentPage--;
                renderMeals();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            throttleTimer = null;
        }, 300);
    });
    
    nextPageBtn.addEventListener('click', () => {
        if (throttleTimer) return;
        
        throttleTimer = setTimeout(() => {
            const totalPages = Math.ceil(filteredMeals.length / mealsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderMeals();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            throttleTimer = null;
        }, 300);
    });
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);