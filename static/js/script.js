var latestId = 1;

addNewIngredient(1);
updateApp();
$('#editMeals').select2({ width: '100%' });
// disable most of the inputs in the create a meal section
var $initInputs = $('#editMeals, #mealName');
var $otherInputs = $('#createMeal :input:not(#editMeals, #mealName)')

$initInputs.on('change', () => {
    const editMeal = $('#editMeals').val();
    const mealName = $('#mealName').val();
    waitForElm('#saveMealBtn').then((elm) => {
        if (editMeal || mealName) {
            $(elm).prop('disabled', false);
        }
        else {
            $(elm).prop('disabled', true);
        }
    });
    if (editMeal || mealName) {
        $otherInputs.prop('disabled', false);
    }
    else {
        $otherInputs.prop('disabled', true);
    }
});


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
                <select class="form-select ingr-select" name="ingredient" required>
                <option value="" disabled selected>Ingredient</option>
            `;
            ingredientList.forEach(ingr => {
                const option = `<option value="${ingr}">${ingr}</option>`;
                ingrSelect += option;
            });
            ingrSelect += '</select>';

        for (let i = 1; i <= num; i++) {
            const html = `
                <div id="ingrRow-${i}" class="row ps-3">
                    <div class="col-sm-1 col-md-auto d-flex align-items-center form-check pe-0">
                        <input class="form-check-input" type="checkbox" title="Delete this ingredient">
                    </div>
                    <div class="col-sm-11 col-md-6 col-lg-3">
                        ${ingrSelect}
                    </div>
                    <div class="col-sm-12 col-md-3 col-lg-3">
                        <input type="number" class="form-control" name="quantity" min="0" placeholder="Quantity">
                    </div>
                    <div class="col-sm-12 col-md-3 col-lg-3">
                        <select name="unit" class="form-select">
                            <option value="" disabled selected>Unit</option>
                            <option value="g">Grams (g)</option>
                            <option value="ml">Millilitres (ml)</option> 
                            <option value="tsp">Teaspoon (tsp)</option>
                            <option value="tbsp">Tablespoon (tbsp)</option>
                            <option value="cups">Cups</option>
                            <option value="whole">Whole</option>
                            <option value="sprigs">Sprigs</option>
                            <option value="Sticks">Sticks</option>
                        </select>
                    </div>
                </div>`;
            ingredients += html;
        }
        $('#ingredients').append(ingredients);
        // only applies select2 once the ingredients nodes have been added
        waitForElm('[id^="ingrRow"]').then( () => {
            $('.ingr-select').select2({ width: '100%' });
        });
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
        const $name = $ingr.find('select[name=ingredient]').val();
        const $quantity = $ingr.find('input[name=quantity]').val();
        const $unit = $ingr.find('select[name=unit]').val();
        
        var ingredient = {}
        
        if ($name) {
            ingredient['name'] = $name;
            if ($quantity && $unit) {
                ingredient['quantity'] = $quantity;
                ingredient['unit'] = $unit;
            }
        }
        // don't save rows with no ingredient name
        if (Object.keys(ingredient).length) {
            ingredients.push(ingredient);
        }
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

// create the Datatable
var table = $('#mealsTable').DataTable({
    columnDefs: [
        { className: 'text-center', targets: [3, 4]},
        { target: 0, visible: false },
        { target: 2, visible: false },
        { target: 5, visible: false },
        { target: 6, visible: false },
        { target: 7, visible: false }
    ],
    order: [[1, 'asc']] // order by name
});

function updateTable(data) {
    table
        .clear()
        .draw();
      
    var meals = [];
    
    data.forEach(meal => {
        const id = Object.keys(meal)[0];
        var ingredients = '<h5>Ingredients</h5>';
        // build the inrgedients
        if (meal[id]['ingredients'][0]['name']) {
            meal[id]['ingredients'].forEach((ingr, index) => {
                if (index === 0) {
                    ingredients += '<ul>';
                }
                ingredients += `
                    <li class="ingr-shown">${ingr['name']} <strong><span class="meal-view-quantity">${ingr['quantity']}</span> (${ingr['unit']})</strong></li>
                    <li class="ingr-hidden" hidden>${ingr['name']} <strong><span class="meal-view-quantity">${ingr['quantity']}</span> (${ingr['unit']})</strong></li>
                `;
            });
        }
        else {
            ingredients += "<p>This meal doesn't have any ingredients so go add some MUPPET<p>";
        }
        ingredients += '</ul>';
        
        if (meal[id]['description']) {
            var description = meal[id]['description']
        }
        else {
            var description = "This meal doesn't have a description so go add one MUPPET";
        }
        // build the description
        const instructions = `<h5>Instructions</h5><p>${description}</p>`;

        mealArray = [
            id,
            meal[id]['name'],
            meal[id]['region'],
            prettyBool(meal[id]['description']),
            prettyBool(meal[id]['ingredients'][0]['name']),
            ingredients,
            instructions,
            meal[id]['serving']
        ]
        meals.push(mealArray);
    });
    
    table.rows.add(meals).draw();
    
    $('#mealsTable').on('click', 'tbody tr', function() {
        const data = table.row(this).data();
        const name = data[1];
        const header = `<h3>${name}</h3><p class="font-small">Original Serving Size (<span id="ogServingSize">${data[7]}</span>)</p>`;
        const ingredients = data[5];
        const description = data[6];
        const serving = data[7];
        const servingInpt = `
            <label for="servingInpt" class="form-label">Change Serving Size</label>
            <input id="servingInpt" type="number" class="form-control" min="0" value="${serving}" placeholder="Serving" onchange="updateIngrQuantity()"></input>
        `;
        $('#detailHeading').html(header);
        $('#servingCalc').html(servingInpt);
        $('#detailIngredients').html(ingredients);
        $('#detailDescription').html(description);
    });
}


function updateIngrQuantity() {
    const $ingredientsHidden = $('#detailIngredients li.ingr-hidden');
    const $ingredientsShown = $('#detailIngredients li.ingr-shown');
    const ogServingSize = parseInt($('#ogServingSize').text());
    const newServingSize = parseInt($('#servingInpt').val());
    const percentChange = newServingSize / ogServingSize
    
    $ingredientsHidden.each( (index, ingr) => {
        const $ingr = $(ingr);
        const $quantityHidden = $ingr.find('.meal-view-quantity');
        // calculate the new quantity
        const quantityVal = parseFloat($quantityHidden.text());
        var newQuantity = Math.round(quantityVal * percentChange * 10) / 10;
        // get the visible quantity value
        const $quantityShown = $ingredientsShown.find('.meal-view-quantity').eq(index);
        // makes the quantity an integer it's a whole number float or larger than 50
        if (newQuantity % 1 == 0 || newQuantity > 50) {
            newQuantity = Math.round(newQuantity);
        }
        $quantityShown.text(newQuantity);
    });
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
    if (id) {   // if the form isn't being reset
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
                        $(elem).find('select[name=ingredient]').val(ingr['name']).trigger('change');
                        $(elem).find('input[name=quantity]').val(ingr['quantity']);
                        $(elem).find('select[name=unit]').val(ingr['unit']);
                    });
                });

                const updateBtns = `
                    <button type="button" id="updateBtn"class="btn btn-primary" onclick="updateMeal()">Update Meal</button>
                    <button type="button" id="deleteBtn"class="btn btn-danger" onclick="deleteMeal()">Delete Meal</button>
                `;
                
                $('#saveMealBtn').replaceWith(updateBtns);
            });
    }
}


function resetForm() {
    $('#createMealForm')[0].reset();
    $('#ingredients').empty();
    addNewIngredient(1);
    $('#editMeals').val($('#editMeals option:first').val()).trigger('change');
    const saveMealBtn = '<button type="button" id="saveMealBtn" class="btn btn-primary" onclick="saveMeal()" disabled>Save Meal</button>';
    $('#updateBtn, #deleteBtn').remove();
    
    if (!$('#saveMealBtn').length) {
        $('#formBtns').prepend(saveMealBtn);
    }
    
    getMeals('all_meals')
        .then((resp) => {
            updateMaxId(resp);
        });
}