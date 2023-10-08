var latestId = 1;


function getIngredients() {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "GET",
            url: "submit.php",
            datatype: 'json',
            data: {'type': 'ingredients'},
            success: (resp, text, xhr) => {
                resolve(JSON.parse(resp));
            },
            error: (xhr, text, err) => {
                reject(err);
            }
        });
    });
}

function addNewIngredient(num) {
    var ingredients = '';
    getIngredients()
        .then((resp) => {
            const ingredientList = resp;
            var ingrSelect = `
                <select name="ingredient" class="form-select" required>
                <option value="" disabled selected>Ingredient</option>
            `;
            ingredientList.forEach(ingr => {
                const option = `<option value="${ingr}">${ingr}</option>`;
                ingrSelect += option;
            });
            ingrSelect += '</select>';

        for (let i = 1; i <= num; i++) {
            const html = `
                <div id="ingrRow-${i}" class="row">
                    <div class="col-auto d-flex align-items-center form-check">
                        <input class="form-check-input" type="checkbox" title="Delete this ingredient">
                    </div>
                    <div class="col-4">
                        ${ingrSelect}
                    </div>
                    <div class="col-3">
                        <input type="number" class="form-control" name="quantity" min="0" placeholder="Quantity">
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
        }
        $('#ingredients').append(ingredients);
    });
}


function deleteIngredient() {
    // delete the selected ingredients
    const toDelete = $('#ingredients input[type=checkbox]:checked');
    toDelete.each(function() {
        $(this).closest('.row').remove();
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
                // console.log('getMeal', type, resp);
                resolve(JSON.parse(resp));
            },
            error: (xhr, text, err) => {
                reject(err);
            }
        });
    });
}


function postMeal(meal, mode) {
    $.ajax({
        type: "POST",
        url: "submit.php",
        datatype: 'json',
        data: {
            'payload': JSON.stringify(meal),
            'mode': mode
        },
        success: (resp, text, xhr) => {
            const meals = JSON.parse(resp);
            updateMaxId(meals);
            updateApp();
            resetForm();
        }
    });
}


function mealToJson() {
    const formData = $('#createMealForm');
    const id = $('#mealId').val();
    const meal = {};
    const jsonMeal = {
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
        const $name = $ingr.find('select[name=ingredient]');
        const $quantity = $ingr.find('input[name=quantity]');
        const $unit = $ingr.find('select[name=unit]');

        const ingredient = {
            "name": $($name).val(),
            "quantity": $($quantity).val(),
            "unit": $($unit).val()
        };
        ingredients.push(ingredient);
    });
    jsonMeal["ingredients"] = ingredients;
    meal[id] = jsonMeal;

    return meal;
}


function saveMeal() {
    const meal = mealToJson();
    postMeal(meal, 'create');
}


function updateMeal() {
    const meal = mealToJson();
    postMeal(meal, 'update');
}


function deleteMeal() {
    const meal = mealToJson();
    postMeal(meal, 'delete');
}

function updateMaxId(meals) {
    if (meals) {
        // get an array of the ids
        var ids = [];
        meals.forEach(meal => {
            for (const id in meal) {
                ids.push(id);
            }
        });
        // convert the ids to ints and get the max
        const maxId = Math.max(...ids);
        latestId = maxId + 1;
        $('#mealId').val(latestId);
    }
    else {
        $('#mealId').val(1);
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


function prettyBool(val) {
    if (val) {
        return '✔️';
    }
    else {
        return '❌';
    }
}


function updateTable(data) {
    $('#mealsView').empty();
    var html = `
        <table id="mealTable" class="table table-hover">
            <thead>
                <tr>
                    <th scope="col">#</th>
                    <th scope="col">Name</th>
                    <th scope="col">Region</th>
                    <th scope="col" class="text-center">Description</th>
                    <th scope="col" class="text-center">Ingredients</th>
                </tr>
            </thead>
            <tbody>`;
    const meals = data;
    if (meals) {    
        meals.forEach(meal => {
            const id = Object.keys(meal)[0];
            const tableRow = `
                <tr onclick=showDetails(this)>
                    <td>${id}</td>
                    <td>${meal[id]['name']}</td>
                    <td>${meal[id]['region']}</td>
                    <td class="text-center">${prettyBool(meal[id]['description'])}</td>
                    <td class="text-center">${prettyBool(meal[id]['ingredients'][0]['name'])}</td>
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


function waitForElm(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }
        // disconnect when the observer detects the element
        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        observer.observe(document.body, {
            childList: true,    // check for addition or removal of child nodes
            subtree: true       // observe all descendants
        });
    });
}


function editMeal() {
    // gets a meal and populates the form with the data so that it can be edited
    const id = $('#editMeals option:selected').val();
    getMeals('a_meal', id)
        .then((resp) => {
            const meal = resp[id];
            $('#mealId').val(id);
            $('#mealName').val(meal['name']);
            $('#region').val(meal['region']);
            $('#course').val(meal['course']);
            $('#serving').val(meal['serving']);
            $('#description').val(meal['description']);

            // get the number of ingredients
            ingr_count = meal['ingredients'].length;
            $('#ingredients').empty();
            addNewIngredient(ingr_count);
            
            meal['ingredients'].forEach((ingr, index) => {
                // wait for the element to exist before setting the values
                waitForElm(`#ingrRow-${index+1}`).then((elem) => {
                    $(elem).find('select[name=ingredient]').val(ingr['name']);
                    $(elem).find('input[name=quantity]').val(ingr['quantity']);
                    $(elem).find('select[name=unit]').val(ingr['unit']);
                });
            });

            const updateBtns = `
                <button type="button" id="updateBtn"class="btn btn-primary" onclick="updateMeal()">Update Meal</button>
                <button type="button" id="deleteBtn"class="btn btn-danger" onclick="deleteMeal()">Delete Meal</button>
            `;
            
            $('#saveBtn').replaceWith(updateBtns);
        });
}


function resetForm() {
    $('#createMealForm')[0].reset();
    $('#ingredients').empty();
    addNewIngredient(1);
    $('#editMeals').val($('#editMeals option:first').val());
    const saveBtn = '<button type="button" id="saveBtn" class="btn btn-primary" onclick="saveMeal()">Save Meal</button>';
    $('#updateBtn, #deleteBtn').remove();
    
    if (!$('#saveBtn').length) {
        $('#formBtns').prepend(saveBtn);
    }
    
    getMeals('all_meals')
        .then(resp =>{
            updateMaxId(resp);
        });
}


function showDetails(row) {
    const $row = $(row);
    const id = $row.find('td').first().text();
    getMeals('a_meal', id)
        .then(resp => {
            buildMealHtml(resp[id]);
        });
}


function buildMealHtml(meal) {

    const header = `<h3>${meal['name']}</h3>`;    
    // build the ingredients
    var ingredients = '<h5>Ingredients</h5>';

    if (meal['ingredients'][0]['name']) {
        meal['ingredients'].forEach((ingr, index) => {
            if (index === 0) {
                ingredients += '<ul>';
            }
            ingredients += `<li>${ingr['name']} <strong><span>${ingr['quantity']}</span> (${ingr['unit']})</strong></li>`;
        });
    }
    else {
        ingredients += "<p>This meal doesn't have any ingredients so go add some MUPPET<p>";
    }
    ingredients += '</ul>';
    // build the description
    if (meal['description']) {
        var description = meal['description']
    }
    else {
        var description = "This meal doesn't have a description so go add one MUPPET";
    }

    const instructions = `<h5>Instructions</h5><p>${description}</p>`;    

    $('#detailHeading').html(header);
    $('#detailIngredients').html(ingredients);
    $('#detailDescription').html(instructions);
}