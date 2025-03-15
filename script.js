document.addEventListener("DOMContentLoaded", () => {
    const searchBox = document.querySelector('.searchBox');
    const searchBtn = document.querySelector('.searchBtn');
    const recipeContainer = document.querySelector('.recipe-container');
    const recipeDetails = document.querySelector('.recipe-details');
    const recipeDetailsContent = document.querySelector('.recipe-details-content');
    const recipeCloseBtn = document.querySelector('.recipe-close-btn');
    const recommendedSection = document.querySelector('.recommended-section');
    const recommendedContainer = document.querySelector('.recommended-container');
    const weeklyRecipeContainer = document.getElementById("weekly-recipe");
    const themeToggle = document.getElementById("theme-toggle");
    const body = document.body;

    // ✅ Load saved theme from localStorage
    if (localStorage.getItem("theme") === "dark") {
        body.classList.add("dark-mode");
    }

    themeToggle.addEventListener("click", () => {
        body.classList.toggle("dark-mode");
        localStorage.setItem("theme", body.classList.contains("dark-mode") ? "dark" : "light");
    });

    // ✅ Fetch Recommended Dishes
    const fetchRecommendedDishes = async () => {
        try {
            const response = await fetch("https://www.themealdb.com/api/json/v1/1/filter.php?c=Seafood");
            const data = await response.json();
            recommendedContainer.innerHTML = "";

            data.meals.slice(0, 6).forEach(meal => {
                const dishDiv = document.createElement("div");
                dishDiv.classList.add("recipe");
                dishDiv.innerHTML = `
                    <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
                    <h3>${meal.strMeal}</h3>
                    <button class="view-recipe-btn" data-id="${meal.idMeal}">View Recipe</button>
                `;

                recommendedContainer.appendChild(dishDiv);
            });
        } catch (error) {
            console.error("Error fetching recommended dishes:", error);
            recommendedContainer.innerHTML = "<p>Failed to load recommended dishes. Try again later.</p>";
        }
    };

    // ✅ Event Delegation for "View Recipe" Buttons
    document.body.addEventListener("click", (event) => {
        if (event.target.classList.contains("view-recipe-btn")) {
            const mealID = event.target.getAttribute("data-id");
            if (mealID) {
                fetchRecipeDetails(mealID);
            }
        }
    });

    // ✅ Fetch Recipe Details
    const fetchRecipeDetails = async (mealID) => {
        try {
            const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealID}`);
            const data = await response.json();

            if (data.meals) {
                openRecipePopup(data.meals[0]);
            }
        } catch (error) {
            console.error("Error fetching recipe details:", error);
        }
    };

    // ✅ Open Recipe Details Popup
    const openRecipePopup = (meal) => {
        document.body.classList.add("no-scroll");

        recipeDetailsContent.innerHTML = `
            <h2 class="recipeName">${meal.strMeal}</h2>
            <h3>Ingredients:</h3>
            <ul class="ingredientList">${fetchIngredients(meal)}</ul>
            <div class="recipeinstructions"> 
                <h3>Instructions:</h3>
                <p>${meal.strInstructions}</p>
            </div>
        `;

        recipeDetails.style.display = "block";
    };

    // ✅ Close Recipe Popup
    if (recipeCloseBtn) {
        recipeCloseBtn.addEventListener('click', () => {
            document.body.classList.remove("no-scroll");
            recipeDetails.style.display = "none";
        });
    }

    // ✅ Extract Ingredients from Meal Object (Optimized)
    const fetchIngredients = (meal) => {
        return Array.from({ length: 20 }, (_, i) => i + 1)
            .map(i => {
                const ingredient = meal[`strIngredient${i}`];
                const measure = meal[`strMeasure${i}`];
                return ingredient ? `<li>${measure} ${ingredient}</li>` : "";
            })
            .filter(item => item)
            .join("");
    };

    // ✅ Search Recipes
    const searchRecipes = async (query) => {
        recommendedSection.classList.add("hidden");
        recipeContainer.innerHTML = "<h2>Searching...</h2>";

        try {
            const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`);
            const data = await response.json();

            recipeContainer.innerHTML = "";

            if (!data.meals) {
                recipeContainer.innerHTML = "<h2>No Recipes Found</h2>";
                return;
            }

            data.meals.forEach(meal => {
                const recipeDiv = document.createElement("div");
                recipeDiv.classList.add("recipe");
                recipeDiv.innerHTML = `
                    <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
                    <h3>${meal.strMeal}</h3>
                    <p><span>${meal.strArea}</span> Dish</p>
                    <p>Belongs to the <span>${meal.strCategory}</span> Category</p>
                    <button class="view-recipe-btn" data-id="${meal.idMeal}">View Recipe</button>
                `;

                recipeContainer.appendChild(recipeDiv);
            });
        } catch (error) {
            console.error("Error fetching recipes:", error);
            recipeContainer.innerHTML = "<h2>Error Fetching Recipes. Try Again.</h2>";
        }
    };

    // ✅ Handle Search Button Click
    searchBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const searchInput = searchBox.value.trim();
        if (searchInput === "") {
            recipeContainer.innerHTML = "<h2>Please enter a search term</h2>";
        } else {
            searchRecipes(searchInput);
        }
    });

    // ✅ Fetch & Cache Recipe of the Week
    const fetchWeeklyRecipe = async () => {
        try {
            const response = await fetch("https://www.themealdb.com/api/json/v1/1/random.php");
            const data = await response.json();

            if (data.meals) {
                const recipe = data.meals[0];
                const weeklyRecipeData = {
                    id: recipe.idMeal,
                    name: recipe.strMeal,
                    image: recipe.strMealThumb,
                    timestamp: Date.now()
                };

                localStorage.setItem("weeklyRecipe", JSON.stringify(weeklyRecipeData));
                displayWeeklyRecipe(weeklyRecipeData);
            }
        } catch (error) {
            console.error("Error fetching weekly recipe:", error);
            weeklyRecipeContainer.innerHTML = "<p>Failed to load recipe. Try again later.</p>";
        }
    };

    const displayWeeklyRecipe = (recipe) => {
        weeklyRecipeContainer.innerHTML = `
            <div class="recipe-card">
                <img src="${recipe.image}" alt="${recipe.name}">
                <h3>${recipe.name}</h3>
            </div>
        `;
    };

    const checkWeeklyRecipe = () => {
        const savedRecipe = JSON.parse(localStorage.getItem("weeklyRecipe"));
        if (savedRecipe && Date.now() - savedRecipe.timestamp < 7 * 24 * 60 * 60 * 1000) {
            displayWeeklyRecipe(savedRecipe);
        } else {
            fetchWeeklyRecipe();
        }
    };

    // ✅ Load Initial Data
    fetchRecommendedDishes();
    checkWeeklyRecipe();
});
