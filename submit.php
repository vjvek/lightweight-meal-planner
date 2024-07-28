<?php

/**
 * Makes sure the meal id is unique
 */
function makeIdUnique($mealArray, $meal) {
    $ids = [];
    // get all the keys
    foreach ($mealArray as $index=>$val) {
        $id = array_keys($mealArray[$index])[0];
        array_push($ids, $id);
    }
    $maxId = max($ids);
    $mealId = array_keys($meal)[0];   
    // if the meal id matches the current max id add 1 to it
    if ($maxId == $mealId) {
        $meal = array($mealId+1=>$meal[$mealId]);
    }  
    return $meal;
}

$recipes = 'data/recipes.json';
$ingredients = 'data/ingredients.json';
$plan = 'data/plan.json';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode($_POST['payload'], true);
    $mode = $_POST['mode'];

    if ($mode !== 'plan') {
        if (!file_exists($recipes)) {
            file_put_contents($recipes, '');
        }
        
        $currentMeals = file_get_contents($recipes); // read the current meals
        $currentMealsArray = json_decode($currentMeals, true);
        $meal = $data;
        if ($mode === 'create') {
            $meal = makeIdUnique($currentMealsArray, $meal);
            $currentMealsArray[] = $meal; // combine the new meal with the existing ones
        }
        else {
            $mealId = array_key_first($meal);   // get the id of the POST meal
            foreach ($currentMealsArray as $index=>$currentMeal) {
                $id = array_keys($currentMeal)[0];  // get the id of each meal
                
                if ($id == $mealId) {
                    if ($mode === 'update') {
                        // replace the existing meal with the updated one
                        $currentMealsArray[$index] = $meal; 
                    }
                    else if ($mode === 'delete') {
                        // delete the meal
                        unset($currentMealsArray[$index]);
                    }
                }
            }
        }
        $updatedMeals = json_encode($currentMealsArray);
        file_put_contents($recipes, $updatedMeals);

        echo $updatedMeals;
    }
    else {
        if (!file_exists($plan)) {
            file_put_contents($plan, '');
        }

        $mealplan = $data;
        file_put_contents($plan, json_encode($mealplan));
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $type = $_GET['type'];
    // create the json file if it doesn't exist
    if (!file_exists($recipes)) {
        file_put_contents($recipes, '');
    }

    if (!file_exists($plan)) {
        file_put_contents($plan, '');
    }
    
    if ($type === 'a_meal' or $type === 'all_meals')
        if (file_exists($recipes) and filesize($recipes) != 0) {
            $currentMeals = file_get_contents($recipes);
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

    if ($type === 'plan') {
        if (file_exists($plan) and filesize($plan) != 0) {
            $mealPlan = file_get_contents($plan);
            
            echo $mealPlan;
        }
    }

    if ($type === 'ingredients') {
        if (file_exists($ingredients) and filesize($ingredients) != 0) {
            $ingredients = file_get_contents($ingredients);
            echo $ingredients;
        }
    }

    else {
        echo false;
    }
}

?>