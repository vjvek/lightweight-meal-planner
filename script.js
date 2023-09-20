function addServingOptions(servingSize) {
    
    for (let i = 1; i <= servingSize; i++) {
        const option = `<option value="${i}">${i}</option>`;
        $('#serving').append(option);
    }
}

var counter = 1
function addNewIngredient() {
    const html = `
    <div class="row">
        <div class="col-4">
            <input type="text" class="form-control" id="ingr-${counter}" name="ingredient" placeholder="Ingredient Name" required>
        </div>
        <div class="col-4">
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
            </select>
        </div>
    </div>`

    counter++
    $('#ingredients').append(html);
}

var id = 1
function saveMeal() {
    const formData = $('#createMealForm');
    var meal = {
        "id": id,
        "name": formData.find('#mealname').val(),
        "region": formData.find('#region').val(),
        "course": formData.find('#course').val(),
        "serving": formData.find('#serving').val(),
        "description": formData.find('#description').val(),
    }

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
    meal["ingredients"] = ingredients;

    $.ajax({
        type: "POST",
        url: "submit.php",
        datatype: 'json',
        data: {payload: JSON.stringify(meal)},
        success: function (response) {
            console.log(JSON.parse(response));
            id++;
        }
    });
}