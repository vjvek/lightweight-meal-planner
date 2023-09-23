<?php

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $newMeal = json_decode($_POST['payload'], true);

    if (!file_exists('recipes.json')) {
        file_put_contents('recipes.json', '');
    }
    
    $currentMeals = file_get_contents('recipes.json'); // read the current meal
    $currentMealsArray = json_decode($currentMeals, true);

    $currentMealsArray[] = $newMeal; // combine the new meal with the existing ones
    $updatedData = json_encode($currentMealsArray);
    file_put_contents('recipes.json', $updatedData);

    echo $updatedData;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists('recipes.json')) {
        $currentMeals = file_get_contents('recipes.json');
        echo $currentMeals;
    }
    else {
        echo 'shit';
    }
}

?>