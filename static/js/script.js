var latestId = 1;

addNewIngredient(1);
updateApp();
$('#editMeals').select2({ width: '100%' });

// handles disabling of the inputs in the create a meal section
var $initInputs = $('#editMeals, #mealName');
var $otherInputs = $('#createMeal :input:not(#editMeals, #mealName)')

$initInputs.on('change', () => {
    const editMeal = $('#editMeals').val();
    const mealName = $('#mealName').val();
    waitForElm('#saveMealBtn').then((btn) => {
        if (editMeal || mealName) {
            $(btn).prop('disabled', false);
        }
        else {
            $(btn).prop('disabled', true);
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


function isChecked() {
    // only enable the delete ingredient button if any rows are checked. There must always be at least 1 inrgedient row
    const checkedCount = $('#ingredients input[type="checkbox"]:checked').length
    const ingrRowCount = $('[id^="ingrRow"]').length
    if (checkedCount && ingrRowCount > 1 && checkedCount < ingrRowCount) {
        $('#dltIngrBtn').prop('disabled', false);
    }
    else {
        $('#dltIngrBtn').prop('disabled', true);
    }    
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
                        <input class="form-check-input" type="checkbox" title="Delete this ingredient" onclick="isChecked()">
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
        "serv": formData.find('#serving').val(),
        "time": {
            "len": formData.find('#totalTime').val(),
            "unit": formData.find('#timeUnit').val()
        },
        "desc": formData.find('#description').val(),
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
                ingredient['quant'] = $quantity;
                ingredient['unit'] = $unit;
            }
        }
        // don't save rows with no ingredient name
        if (Object.keys(ingredient).length) {
            ingredients.push(ingredient);
        }
    });

    jsonMeal["ingrs"] = ingredients;
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
        { className: 'text-center', targets: [3, 4, 8]},
        { target: 0, visible: false },
        { target: 2, visible: false },
        { target: 5, visible: false },
        { target: 6, visible: false },
        { target: 7, visible: false },
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
        var ingredients = '';
        // build the inrgedients
        if (meal[id]['ingrs'].length) {
            meal[id]['ingrs'].forEach((ingr, index) => {
                if (index === 0) {
                    ingredients += '<ul>';
                }
                var quantity = '';
                if (ingr['quant']) {
                    var quantity = `<strong><span class="meal-view-quantity">${ingr['quant']}</strong> (${ingr['unit']})</span>`;
                }
                ingredients += `
                    <li class="ingr-shown">${ingr['name']} <strong>${quantity}</strong></li>
                    <li class="ingr-hidden" hidden>${ingr['name']} <strong>${quantity}</strong></li>
                `;
            });
            ingredients += '</ul>';
        }
        else {
            ingredients += "<p>This meal doesn't have any ingredients so go add some MUPPET<p>";
        }

        // build the description
        if (meal[id]['desc']) {
            var desc = meal[id]['desc']
        }
        else {
            var desc = "This meal doesn't have a description so go add one MUPPET";
        }
        const description = `<h5>Instructions</h5><p>${desc}</p>`;
        // build the meal time
        if (meal[id]['time']['len']) {
            var time = `${meal[id]['time']['len']} ${meal[id]['time']['unit']}`;
        }
        else {
            var time = '-';
        }

        mealArray = [
            id,
            meal[id]['name'],
            meal[id]['region'],
            prettyBool(meal[id]['desc']),
            prettyBool(meal[id]['ingrs'].length),
            ingredients,
            description,
            meal[id]['serv'],
            time
        ]
        meals.push(mealArray);
    });
    
    table.rows.add(meals).draw();
    // when a row in the table is clicked show the meal details
    $('#mealsTable').on('click', 'tbody tr', function() {
        const data = table.row(this).data();
        const name = data[1];
        const serving = data[7];
        const ingredients = data[5];
        const hasQuantities = $(ingredients).find('.meal-view-quantity').length;
        var servingHtml = '<p class="font-small">There is no serving size saved for this meal.</p>';
        var servingInpt = '';
        if (serving) {
            servingHtml = `<p class="font-small">Original Serving Size (<span id="ogServingSize">${data[7]}</span>)</p>`;
        }
        
        if (serving && hasQuantities) {
            servingInpt = `
            <label for="servingInpt" class="form-label">Change Serving Size</label>
            <input id="servingInpt" type="number" class="form-control" min="1" value="${serving}" placeholder="Serving" onchange="updateIngrQuantity()"></input>
            `;
        }
        
        const header = `<h3>${name}</h3>${servingHtml}` + servingInpt;
        const copyBtn = '<button type="button" class="btn btn-primary" onclick="mealToClipboard()"><i class="bi bi-copy"></i></button>'
        const description = data[6];
        const mealTime = `<p>⏰ ${data[8]}</p>`;
        $('#detailHeading').html(header);
        $('#mealToClipboard').html(copyBtn);
        $('#mealTime').html(mealTime);
        $('#detailIngredients').html(ingredients);
        $('#detailDescription').html(description);
    });
}


function mealToClipboard() {
    
    var textToCopy = '';
    const name = $('#detailHeading h3').text();
    const serving = $('#servingInpt').val();
    textToCopy = `${name}\n\nServing Size: ${serving}`;

    const ingrs = $('#detailIngredients').find('li.ingr-shown');
    if (ingrs.length) {
        textToCopy += '\n\n';
        ingrs.each(function() {
            textToCopy += $(this).text() + '\n';
        });
    }
    const description = $('#detailDescription p').text();
    textToCopy += '\n\n' + description;
    
    if (window.location.protocol == 'http:') {
        const clipboardInput = $('<textarea>');
        $('#detailDescription').after(clipboardInput);
        
        clipboardInput.val(textToCopy).select();
        document.execCommand("copy");
        clipboardInput.remove();
    }
    else {
        const clipboardText = async () => {
            try {
                await navigator.clipboard.writeText(newClip);
            }
            catch(err) {
                alert('Failed to copy to clipboard. This browser may not support the API being used.\n\n', err)
            }
        }
    }
    
    const checkIcon = '<i class="bi bi-check2"></i>';
    const copyIcon = '<i class="bi bi-copy"></i>';
    const $copyBtn = $('#mealToClipboard button');
    $copyBtn.html(checkIcon);
    
    setTimeout(() => {
        $copyBtn.html(copyIcon);
    }, 1500);
}


function updateIngrQuantity() {
    const $ingredientsHidden = $('#detailIngredients li.ingr-hidden:has(span.meal-view-quantity)');
    const $ingredientsShown = $('#detailIngredients li.ingr-shown:has(span.meal-view-quantity)');
    const ogServingSize = parseInt($('#ogServingSize').text());
    const newServingSize = parseInt($('#servingInpt').val());
    const percentChange = newServingSize / ogServingSize;
    
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


const el = document.getElementById('ingredients');
var sortable = Sortable.create(el);
sortable.option('disabled', true);


function enableSortMode() {
    $('#enableSortBtn').hide();
    $('#disableSortBtn').show();
    sortable.option('disabled', false);
}


function disableSortMode() {
    $('#disableSortBtn').hide();
    $('#enableSortBtn').show();
    sortable.option('disabled', true);
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

function getVal() {
    const obj = arguments[0];
    const key1 = arguments[1];
    if (arguments.length > 2) {
        var key2 = arguments[2];
        if (obj.hasOwnProperty(key1) && obj[key1].hasOwnProperty(key2)) {
            return obj[key1][key2];
        }
    }
    else {
        return obj[key1];
    }
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
                $('#region').val(getVal(meal, 'region'));
                $('#course').val(getVal(meal, 'course'));
                $('#serving').val(getVal(meal, 'serv'));
                $('#totalTime').val(getVal(meal, 'time', 'len'));
                $('#timeUnit').val(getVal(meal, 'time', 'unit'));
                $('#description').val(getVal(meal, 'desc'));
                // get the number of ingredients
                if (meal['ingrs'].length) {
                    var ingr_count = meal['ingrs'].length;
                }
                else {
                    var ingr_count = 1;
                }
                $('#ingredients').empty();
                addNewIngredient(ingr_count);
                
                meal['ingrs'].forEach((ingr, index) => {
                    // wait for the element to exist before setting the values
                    waitForElm(`#ingrRow-${index+1}`).then((ingrRow) => {
                        $(ingrRow).find('select[name=ingredient]').val(ingr['name']).trigger('change');
                        $(ingrRow).find('input[name=quantity]').val(ingr['quant']);
                        $(ingrRow).find('select[name=unit]').val(ingr['unit']);
                    });
                });

                $('#saveMealBtn').hide();
                $('#updateMealBtn').show();
                $('#deleteMealBtn').show();
            });
    }
}


function resetForm() {
    $('#createMealForm')[0].reset();
    $('#ingredients').empty();
    addNewIngredient(1);
    $('#editMeals').val($('#editMeals option:first').val()).trigger('change');
    $('#saveMealBtn').show();
    $('#updateMealBtn').hide();
    $('#deleteMealBtn').hide();
    disableSortMode();
    
    getMeals('all_meals')
        .then((resp) => {
            updateMaxId(resp);
        });
}