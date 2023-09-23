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
function addNewIngredient() {
    const html = `
        <div class="row">
            <div class="col-auto d-flex align-items-center form-check">
                <input class="form-check-input" type="checkbox" title="Delete this ingredient">
            </div>
            <div class="col-4">
                <input type="text" class="form-control" id="ingr-${counter}" name="ingredient" placeholder="Ingredient Name" required>
            </div>
            <div class="col-3">
                <input type="text" class="form-control" id="quantity-${counter}" name="quantity" placeholder="Quantity">
            </div>
            <div class="col-4">
                <select name="unit" id="unit-${counter}" class="form-select">
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

    counter++
    $('#ingredients').append(html);
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

    const ingredientCount = formData.find('#ingredients .row').length;
    // create the ingredients
    var ingredients = [];
    for (let i = 1; i <= ingredientCount; i++) {
        const nameId = `#ingr-${i}`;
        const quantityiD = `#quantity-${i}`;
        const unitId = `#unit-${i}`;

        const ingredient = {
            "name": $(nameId).val(),
            "quantity": $(quantityiD).val(),
            "unit": $(unitId).val()
        };
        ingredients.push(ingredient);
    }
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
            buildTable();
        }
    });
}


function getMeals() {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "GET",
            url: "submit.php",
            datatype: 'json',
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


function buildTable() {
    getMeals()
    .then((resp) => {
        updateMaxId(resp);
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
        const meals = resp;
        console.log(meals)
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
        html += '</tbody></table>'
        $('#mealsView').append(html);
    });
}