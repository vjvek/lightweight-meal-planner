<?php

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $meal = json_decode($_POST['payload'], true);
    $mode = $_POST['mode'];

    if (!file_exists('recipes.json')) {
        file_put_contents('recipes.json', '');
    }
    
    if ($mode === 'create') {
        $currentMeals = file_get_contents('recipes.json'); // read the current meals
        $currentMealsArray = json_decode($currentMeals, true);

        $currentMealsArray[] = $meal; // combine the new meal with the existing ones
        $updatedData = json_encode($currentMealsArray);
        file_put_contents('recipes.json', $updatedData);

        echo $updatedData;
    }
    if ($mode === 'update') {
        $currentMeals = file_get_contents('recipes.json'); // read the current meals
        $currentMealsArray = json_decode($currentMeals, true);
        
        $mealId = array_key_first($meal);
        foreach ($currentMealsArray as $index=>$currentMeal) {
            $id = array_keys($currentMeal)[0];
            if ($id == $mealId) {
                $currentMealsArray[$index] = $meal;
            }
        }
        $updatedMeals = json_encode($currentMealsArray);
        file_put_contents('recipes.json', $updatedMeals);

        echo $updatedMeals;
    }
}


function filterByID($meal, $id) {
    return array_key_exists($id, $meal);
}


if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $type = $_GET['type'];
    // create the json file if it doesn't exist
    if (!file_exists('recipes.json')) {
        file_put_contents('recipes.json', '');
    }
    
    if (file_exists('recipes.json') and filesize('recipes.json') != 0) {
        $currentMeals = file_get_contents('recipes.json');
        if ($type === 'all_meals') {
            echo $currentMeals;
        }
        else if ($type === 'a_meal') {
            $id = $_GET['id'];
            $currentMealsArray = json_decode($currentMeals, true);
            // use the id to get the meal that the user wants to update.
            $meal = [];
            foreach ($currentMealsArray as $meals) {
                if (array_key_exists($id, $meals)) {
                    $meal = array($id=>$meals[$id]);
                    break;
                }
            }
            echo json_encode($meal);
        }
    }
    else {
        echo false;
    }
}

?>