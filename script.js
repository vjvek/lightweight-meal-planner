var latestId = 0;

function addServingOptions(servingSize) {    
    var options = '';
    for (let i = 1; i <= servingSize; i++) {
        options += `<option value="${i}">${i}</option>`;    
    }
    options += '<option value="N/A">N/A</option>';
    $('#serving').append(options);
}

var counter = 1
function addNewIngredient(num) {
    ingredients = '';
    // if the ingre has contents check the id of the last row
    // else 1
    for (let i = 1; i <= num; i++) {
        const html = `
            <div class="row">
                <div class="col-auto d-flex align-items-center form-check">
                    <input class="form-check-input" type="checkbox" title="Delete this ingredient">
                </div>
                <div class="col-4">
                    <input type="text" class="form-control" name="ingredient" placeholder="Ingredient Name" required>
                </div>
                <div class="col-3">
                    <input type="text" class="form-control" name="quantity" placeholder="Quantity">
                </div>
                <div class="col-4">
                    <select name="unit" class="form-select">
                        <option value="" disabled selected>Unit</option>
                        <option value="g">Grams (g)</option>
                        <option value="ml">Millilitres (ml)</option> 
                        <option value="tsp">Teaspoon (tsp)</option>
                        <option value="tbsp">Tablespoon (tbsp)</option>
                        <option value="cups">Cups</option>
                        <option value="whole">Whole</option>
                    </select>
                </div>
            </div>`;
        ingredients += html;
        counter++;
    }
    $('#ingredients').append(ingredients);
}


function deleteIngredient() {
    // delete the selected ingredients
    const toDelete = $('#ingredients input[type=checkbox]:checked');
    toDelete.each(function() {
        $(this).closest('.row').remove();
    });
}


function saveMeal() {
    const formData = $('#createMealForm');
    var id = latestId + 1;
    var meal = {};
    meal[id] = {
        "name": formData.find('#mealName').val(),
        "region": formData.find('#region').val(),
        "course": formData.find('#course').val(),
        "serving": formData.find('#serving').val(),
        "description": formData.find('#description').val(),
    };    

    const $ingrRows = formData.find('#ingredients .row');
    // create the ingredients
    var ingredients = [];
    $ingrRows.each(function() {
        const $ingr = $(this);
        const $name = $ingr.find('input[name=ingredient]');
        const $quantity = $ingr.find('input[name=quantity]');
        const $unit = $ingr.find('select[name=unit]');

        const ingredient = {
            "name": $($name).val(),
            "quantity": $($quantity).val(),
            "unit": $($unit).val()
        };
        ingredients.push(ingredient);
    });

    meal[id]["ingredients"] = ingredients;
    console.log(meal);
    $.ajax({
        type: "POST",
        url: "submit.php",
        datatype: 'json',
        data: {payload: JSON.stringify(meal)},
        success: (resp, text, xhr) => {
            const newRow = `
                <tr>
                    <td>${meal['id']}</td>
                    <td>${meal['name']}</td>
                    <td>${meal['region']}</td>
                </tr>`;
            $('#mealTable tbody').append(newRow);
            updateMaxId(meal);
            updateApp();
            resetForm();
        }
    });
}


function getMeals(type, id) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "GET",
            url: "submit.php",
            datatype: 'json',
            data: {'type': type, 'id': id},
            success: (resp, text, xhr) => {
                resolve(JSON.parse(resp));
            },
            error: (xhr, text, err) => {
                reject(err);
            }
        });
    });
}


function updateMaxId(meals) {
    if (meals) {
        // get an array of the ids
        const ids = Object.keys(meals);
        // convert the ids to ints and get the max
        const maxId = Math.max(...ids.map(Number));
        latestId = maxId;
    }
}


function updateApp() {
    getMeals('all_meals')
    .then((resp) => {
        updateMaxId(resp);
        updateTable(resp);
        updateMealList(resp);
    });
}


function updateTable(data) {
    $('#mealsView').empty();
    var html = `
        <table id="mealTable" class="table">
            <thead>
                <tr>
                    <th scope="col">#</th>
                    <th scope="col">Name</th>
                    <th scope="col">Region</th>
                </tr>
            </thead>
            <tbody>`;
    const meals = data;
    console.log(meals);
    if (meals) {    
        meals.forEach(meal => {
            const id = Object.keys(meal)[0];
            const tableRow = `
                <tr>
                    <td>${id}</td>
                    <td>${meal[id]['name']}</td>
                    <td>${meal[id]['region']}</td>
                </tr>`;
            html += tableRow;
        });
        html += '</tbody></table>';
        $('#mealsView').append(html);
    }
}


function updateMealList(data) {
    const meals = data;
    var options = '';
    meals.forEach(meal => {
        const id = Object.keys(meal)[0];
        options += `<option value="${id}">${meal[id]['name']}</option>`;
    });
    $('#editMeals option:enabled').remove();
    $('#editMeals').append(options);
}


function editMeal() {
    // gets a meal and populates the form with the data so that it can be edited
    const id = $('#editMeals option:selected').val();
    getMeals('a_meal', id)
        .then((resp) => {
            const meal = resp[id];
            console.log(meal)
            $('#mealName').val(meal['name']);
            $('#region').val(meal['region']);
            $('#course').val(meal['course']);
            $('#serving').val(meal['serving']);
            $('#description').val(meal['description']);

            // get the number of ingredients
            ingr_count = meal['ingredients'].length;
            $('#ingredients').empty();
            addNewIngredient(ingr_count);

            const $ingrRows = $('#createMealForm').find('#ingredients .row');
            meal['ingredients'].forEach((ingr, index) => {
                $row = $ingrRows.eq(index);
                $row.find('input[name=ingredient]').val(ingr['name']);
                $row.find('input[name=quantity]').val(ingr['quantity']);
                $row.find('select[name=unit]').val(ingr['unit']);
            });
        });
}


function resetForm() {
    $('#createMealForm')[0].reset();
    $('#ingredients').empty();
    addNewIngredient(1);
    $('#editMeals').val($('#editMeals option:first').val());
}